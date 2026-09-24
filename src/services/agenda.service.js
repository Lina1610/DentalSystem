'use strict';

const Agenda = require('../models/agenda.model');
const { NotFoundError, ConflictError } = require('../helpers/errors');

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

const crearAgenda = async (data) => {
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

const actualizarAgenda = async (id, data) => {
  const actual = await obtenerAgendaPorId(id);

  const tocaHorario = data.id_odontologo || data.fecha || data.hora_inicio || data.hora_fin;
  if (tocaHorario) {
    const idOdontologo = data.id_odontologo ?? actual.id_odontologo;
    const fecha         = data.fecha         ?? actual.fecha;
    const horaInicio    = data.hora_inicio   ?? actual.hora_inicio;
    const horaFin        = data.hora_fin      ?? actual.hora_fin;

    const solapa = await Agenda.existeSolapamiento(idOdontologo, fecha, horaInicio, horaFin, id);
    if (solapa) {
      throw new ConflictError('El horario se solapa con otro ya registrado para este odontólogo');
    }
  }

  return Agenda.update(id, data);
};

const cambiarEstadoAgenda = async (id, estado) => {
  await obtenerAgendaPorId(id);
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
