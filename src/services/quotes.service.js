const Quotes = require('../models/quotes.model');
const Agenda = require('../models/agenda.model');
const { NotFoundError, ConflictError } = require('../helpers/errors');

const crearQuotes = async (data) => {
  const conflict = await Quotes.existeConflictoHorario(
    data.id_odontologo,
    data.fecha_inicio,
    data.fecha_fin
  );
  if (conflict) {
    throw new ConflictError('La cita entra en conflicto con otra cita existente para el mismo odontólogo');
  }

  const horario = await Agenda.findById(data.id_agenda);
  if (!horario) {
    throw new NotFoundError('El horario de agenda seleccionado no existe');
  }
  if (Number(horario.id_odontologo) !== Number(data.id_odontologo)) {
    throw new ConflictError('El horario seleccionado no pertenece a ese odontólogo');
  }
  if (horario.estado !== 'DISPONIBLE') {
    throw new ConflictError('El horario seleccionado ya no está disponible');
  }

  const quote = await Quotes.create(data);
  await Agenda.cambiarEstado(data.id_agenda, 'OCUPADO');
  return quote;
};

const obtenerQuotes = async ({ pagina = 1, limite = 10, busqueda = '', estado = '', id_paciente = '', id_odontologo = '' } = {}) => {
  const offset = (pagina - 1) * limite;
  return Quotes.findAll({ limite, offset, busqueda, estado, id_paciente, id_odontologo });
};

const obtenerQuotesPorId = async (id) => {
  const quote = await Quotes.findById(id);
  if (!quote) {
    throw new NotFoundError('Cita no encontrada');
  }
  return quote;
};

const actualizarQuotes = async (id, data) => {
  const citaActual = await obtenerQuotesPorId(id);

  if (data.id_odontologo && (data.fecha_inicio || data.fecha_fin)) {
    const conflict = await Quotes.existeConflictoHorario(
      data.id_odontologo,
      data.fecha_inicio,
      data.fecha_fin,
      id
    );
    if (conflict) {
      throw new ConflictError('La cita entra en conflicto con otra cita existente para el mismo odontólogo');
    }
  }

  // Reprogramar a otro horario de agenda: valida el nuevo y libera el anterior
  if (data.id_agenda && Number(data.id_agenda) !== Number(citaActual.id_agenda)) {
    const nuevoHorario = await Agenda.findById(data.id_agenda);
    if (!nuevoHorario) {
      throw new NotFoundError('El horario de agenda seleccionado no existe');
    }
    if (nuevoHorario.estado !== 'DISPONIBLE') {
      throw new ConflictError('El horario seleccionado ya no está disponible');
    }

    const actualizada = await Quotes.update(id, data);

    if (citaActual.estado !== 'CANCELADA') {
      await Agenda.cambiarEstado(citaActual.id_agenda, 'DISPONIBLE');
    }
    await Agenda.cambiarEstado(data.id_agenda, 'OCUPADO');

    return actualizada;
  }

  return Quotes.update(id, data);
};

const eliminarQuotes = async (id, observaciones = null) => {
  const citaActual = await obtenerQuotesPorId(id);
  await Quotes.cancelar(id, observaciones);

  if (citaActual.estado !== 'CANCELADA') {
    await Agenda.cambiarEstado(citaActual.id_agenda, 'DISPONIBLE');
  }

  return { message: 'Cita cancelada correctamente' };
};

const cambiarEstadoQuote = async (id, estado) => {
  const citaActual = await obtenerQuotesPorId(id);

  if (estado === 'CANCELADA' && citaActual.estado !== 'CANCELADA') {
    await Agenda.cambiarEstado(citaActual.id_agenda, 'DISPONIBLE');
  } else if (citaActual.estado === 'CANCELADA' && estado !== 'CANCELADA') {
    const horario = await Agenda.findById(citaActual.id_agenda);
    if (horario && horario.estado !== 'DISPONIBLE') {
      throw new ConflictError('El horario de esta cita ya no está disponible; reprográmala con otro horario.');
    }
    await Agenda.cambiarEstado(citaActual.id_agenda, 'OCUPADO');
  }

  return Quotes.cambiarEstado(id, estado);
};

module.exports = {
  crearQuotes,
  obtenerQuotes,
  obtenerQuotesPorId,
  actualizarQuotes,
  eliminarQuotes,
  cambiarEstadoQuote,
};