'use strict';

const Agenda = require('../models/agenda.model');
const Quotes = require('../models/quotes.model');
const { NotFoundError, ConflictError, ValidationError } = require('../helpers/errors');

const ESTADOS_AGENDA = ['DISPONIBLE', 'OCUPADO', 'BLOQUEADO', 'NO_DISPONIBLE'];

const obtenerAgendas = async ({
  pagina = 1,
  limite = 10,
  busqueda = '',
  id_odontologo = '',
  fecha = '',
  estado = '',
} = {}) => {
  const offset = (pagina - 1) * limite;
  return Agenda.findAll({ limite, offset, busqueda, id_odontologo, fecha, estado });
};

const obtenerDisponibles = async ({ id_odontologo = '', fecha = '' } = {}) => {
  return Agenda.findDisponibles({ id_odontologo, fecha });
};

const obtenerAgendaPorId = async (id) => {
  const horario = await Agenda.findById(id);
  if (!horario) {
    throw new NotFoundError('Horario de agenda no encontrado');
  }
  return horario;
};

// No tiene sentido ofrecer disponibilidad en un momento que ya pasó
const validarHorarioFuturo = async (fecha, horaInicio) => {
  if (await Agenda.yaPaso(fecha, horaInicio)) {
    throw new ConflictError('No se pueden crear ni mover horarios a una fecha y hora que ya pasaron');
  }
};

const crearAgenda = async (data) => {
  if (data.estado) {
    validarEstadoContraCitas(data.estado, []);
  }

  await validarHorarioFuturo(data.fecha, data.hora_inicio);

  const solapa = await Agenda.existeSolapamiento(
    data.id_odontologo,
    data.fecha,
    data.hora_inicio,
    data.hora_fin
  );
  if (solapa) {
    throw new ConflictError('El horario se solapa con otro ya registrado para este odontólogo');
  }

  return Agenda.create(data);
};

// El estado de un horario debe coincidir con sus citas: OCUPADO si y solo si
// tiene una cita activa (no cancelada). Ese estado lo gestiona el módulo de citas.
const validarEstadoContraCitas = (estado, citasActivas) => {
  if (!ESTADOS_AGENDA.includes(estado)) {
    throw new ValidationError(`Estado de agenda inválido. Valores permitidos: ${ESTADOS_AGENDA.join(', ')}`);
  }
  if (citasActivas.length > 0 && estado !== 'OCUPADO') {
    throw new ConflictError(
      `Este horario tiene la cita #${citasActivas[0].id_cita} activa. Cancélala o reprográmala antes de cambiar el horario.`
    );
  }
  if (citasActivas.length === 0 && estado === 'OCUPADO') {
    throw new ConflictError('OCUPADO se asigna automáticamente al agendar una cita. Para reservar el horario sin cita usa BLOQUEADO.');
  }
};

const actualizarAgenda = async (id, data) => {
  const actual = await obtenerAgendaPorId(id);
  const citasActivas = await Quotes.findActivasPorAgenda(id);

  if ('estado' in data) {
    validarEstadoContraCitas(data.estado, citasActivas);
  }

  const tocaHorario = data.id_odontologo || data.fecha || data.hora_inicio || data.hora_fin;
  if (tocaHorario && citasActivas.length > 0) {
    throw new ConflictError(
      `Este horario tiene la cita #${citasActivas[0].id_cita} activa. Reprográmala antes de cambiar odontólogo, fecha u horas.`
    );
  }
  if (tocaHorario) {
    const idOdontologo = data.id_odontologo ?? actual.id_odontologo;
    const fecha         = data.fecha         ?? actual.fecha;
    const horaInicio    = data.hora_inicio   ?? actual.hora_inicio;
    const horaFin        = data.hora_fin      ?? actual.hora_fin;

    // Solo al mover fecha u horas: cambiar el odontólogo o la observación de un horario pasado sigue permitido
    if (data.fecha || data.hora_inicio) {
      await validarHorarioFuturo(fecha, horaInicio);
    }

    const solapa = await Agenda.existeSolapamiento(idOdontologo, fecha, horaInicio, horaFin, id);
    if (solapa) {
      throw new ConflictError('El horario se solapa con otro ya registrado para este odontólogo');
    }
  }

  return Agenda.update(id, data);
};

const cambiarEstadoAgenda = async (id, estado) => {
  await obtenerAgendaPorId(id);
  validarEstadoContraCitas(estado, await Quotes.findActivasPorAgenda(id));
  return Agenda.cambiarEstado(id, estado);
};

module.exports = {
  obtenerAgendas,
  obtenerDisponibles,
  obtenerAgendaPorId,
  crearAgenda,
  actualizarAgenda,
  cambiarEstadoAgenda,
};
