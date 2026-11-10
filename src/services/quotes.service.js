const Quotes = require('../models/quotes.model');
const Agenda = require('../models/agenda.model');
const Service = require('../models/service.model');
const { NotFoundError, ConflictError, ValidationError } = require('../helpers/errors');
const { withTransaction } = require('../helpers/transaction');

const ESTADOS_CITA = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'];

// Una cita ocupa su horario de agenda mientras no esté cancelada
// (FINALIZADA también: ese bloque ya fue usado).
const ocupaHorario = (estado) => estado !== 'CANCELADA';

// Estados de una cita que todavía se va a atender: solo esos exigen un horario futuro.
// Registrar o corregir una cita FINALIZADA en un horario pasado sigue permitido (historial).
const porAtender = (estado) => estado === 'PENDIENTE' || estado === 'CONFIRMADA';

// Verifica que `cita` pueda quedarse con su horario de agenda.
// Bloquea la fila de agenda hasta el fin de la transacción.
// `yaLoOcupa`: la cita ya tenía este mismo horario reservado (al editarla).
// `exigirFuturo`: el horario no puede haber empezado (al reservar uno nuevo para atender).
const validarHorario = async (conn, cita, { idCitaExcluida = null, yaLoOcupa = false, exigirFuturo = false } = {}) => {
  const horario = await Agenda.findByIdParaReservar(
    cita.id_agenda,
    cita.fecha_inicio,
    cita.fecha_fin,
    conn
  );

  if (!horario) {
    throw new NotFoundError('El horario de agenda seleccionado no existe');
  }
  if (Number(horario.id_odontologo) !== Number(cita.id_odontologo)) {
    throw new ConflictError('El horario seleccionado no pertenece a ese odontólogo');
  }
  if (!Number(horario.cubre_rango)) {
    throw new ConflictError('La fecha y hora de la cita deben estar dentro del horario de agenda seleccionado');
  }
  if (exigirFuturo && Number(horario.ya_paso)) {
    throw new ConflictError('El horario seleccionado ya pasó; elige un horario de hoy en adelante');
  }

  const otrasCitas = await Quotes.findActivasPorAgenda(cita.id_agenda, idCitaExcluida, conn);
  if (otrasCitas.length > 0) {
    throw new ConflictError('El horario seleccionado ya está reservado por otra cita');
  }

  // Si la cita ya tenía este horario, el bloque está OCUPADO por ella misma
  const esSuPropioHorario = yaLoOcupa && horario.estado === 'OCUPADO';
  if (horario.estado !== 'DISPONIBLE' && !esSuPropioHorario) {
    throw new ConflictError('El horario seleccionado ya no está disponible');
  }

  const conflicto = await Quotes.existeConflictoHorario(
    cita.id_odontologo,
    cita.fecha_inicio,
    cita.fecha_fin,
    idCitaExcluida,
    conn
  );
  if (conflicto) {
    throw new ConflictError('La cita entra en conflicto con otra cita existente para el mismo odontólogo');
  }
};

// Devuelve el horario a DISPONIBLE solo si ninguna otra cita lo ocupa
// y estaba OCUPADO (no se pisa un BLOQUEADO / NO_DISPONIBLE puesto a mano).
const liberarHorario = async (conn, idAgenda) => {
  const activas = await Quotes.findActivasPorAgenda(idAgenda, null, conn);
  if (activas.length > 0) return;

  await Agenda.liberar(idAgenda, conn);
};

// Solo se pueden asignar servicios activos (el frontend ya los filtra, pero la API también lo exige)
const validarServicioActivo = async (idServicio) => {
  const servicio = await Service.findById(idServicio);
  if (!servicio) {
    throw new NotFoundError('El servicio seleccionado no existe');
  }
  if (servicio.estado !== 'ACTIVO') {
    throw new ConflictError(`El servicio "${servicio.nombre}" está inactivo y no se puede asignar a una cita`);
  }
};

const crearQuotes = async (data) => {
  await validarServicioActivo(data.id_servicio);

  return withTransaction(async (conn) => {
    const estado = data.estado ?? 'PENDIENTE';
    if (ocupaHorario(estado)) {
      await validarHorario(conn, data, { exigirFuturo: porAtender(estado) });
    }

    const quote = await Quotes.create(data, conn);

    if (ocupaHorario(quote.estado)) {
      await Agenda.cambiarEstado(quote.id_agenda, 'OCUPADO', conn);
    }
    return quote;
  });
};

const obtenerQuotes = async ({ pagina = 1, limite = 10, busqueda = '', estado = '', id_paciente = '', id_odontologo = '', fecha = '' } = {}) => {
  const offset = (pagina - 1) * limite;
  return Quotes.findAll({ limite, offset, busqueda, estado, id_paciente, id_odontologo, fecha });
};

const obtenerQuotesPorId = async (id, db) => {
  const quote = await Quotes.findById(id, db);
  if (!quote) {
    throw new NotFoundError('Cita no encontrada');
  }
  return quote;
};

// Toda modificación de una cita (editar, cambiar estado, cancelar) pasa por aquí,
// para que la cita y su horario de agenda queden siempre sincronizados.
const actualizarQuotes = async (id, data) => {
  return withTransaction(async (conn) => {
    const actual = await obtenerQuotesPorId(id, conn);

    // Una cita existente conserva su servicio aunque se desactive después;
    // solo se valida al cambiarlo por otro.
    if ('id_servicio' in data && Number(data.id_servicio) !== Number(actual.id_servicio)) {
      await validarServicioActivo(data.id_servicio);
    }
    const final = { ...actual, ...data };

    const cambiaAgenda = Number(final.id_agenda) !== Number(actual.id_agenda);
    const cambiaHorario = cambiaAgenda
      || Number(final.id_odontologo) !== Number(actual.id_odontologo)
      || 'fecha_inicio' in data
      || 'fecha_fin' in data;
    const ocupabaAntes = ocupaHorario(actual.estado);
    const ocupaAhora = ocupaHorario(final.estado);

    // Validar si la cita queda activa y cambió su horario, o si se reactiva
    if (ocupaAhora && (cambiaHorario || !ocupabaAntes)) {
      // Mover a otro horario o reactivar una cancelada exige un horario futuro;
      // editar una cita que conserva su horario (aunque ya haya pasado) no.
      const reservaNueva = cambiaAgenda || !ocupabaAntes;
      await validarHorario(conn, final, {
        idCitaExcluida: id,
        yaLoOcupa: ocupabaAntes && !cambiaAgenda,
        exigirFuturo: reservaNueva && porAtender(final.estado),
      });
    }

    const actualizada = await Quotes.update(id, data, conn);

    if (ocupabaAntes && (cambiaAgenda || !ocupaAhora)) {
      await liberarHorario(conn, actual.id_agenda);
    }
    if (ocupaAhora) {
      await Agenda.cambiarEstado(final.id_agenda, 'OCUPADO', conn);
    }

    return actualizada;
  });
};

const eliminarQuotes = async (id, observaciones = null) => {
  await actualizarQuotes(id, {
    estado: 'CANCELADA',
    ...(observaciones != null ? { observaciones } : {}),
  });

  return { message: 'Cita cancelada correctamente' };
};

const cambiarEstadoQuote = async (id, estado) => {
  if (!ESTADOS_CITA.includes(estado)) {
    throw new ValidationError(`Estado de cita inválido. Valores permitidos: ${ESTADOS_CITA.join(', ')}`);
  }
  return actualizarQuotes(id, { estado });
};

module.exports = {
  crearQuotes,
  obtenerQuotes,
  obtenerQuotesPorId,
  actualizarQuotes,
  eliminarQuotes,
  cambiarEstadoQuote,
};
