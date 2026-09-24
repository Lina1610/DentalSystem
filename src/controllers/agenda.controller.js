const agendaService = require('../services/agenda.service');

const crear = async (req, res, next) => {
  try {
    const horario = await agendaService.crearAgenda(req.body);
    res.status(201).json(horario);
  } catch (error) {
    next(error);
  }
};

const obtenerTodos = async (req, res, next) => {
  try {
    const pagina        = Number(req.query.pagina) || 1;
    const limite        = Number(req.query.limite) || 10;
    const busqueda      = (req.query.busqueda      ?? '').toString().trim();
    const id_odontologo = (req.query.id_odontologo ?? '').toString().trim();
    const fecha         = (req.query.fecha         ?? '').toString().trim();
    const estado        = (req.query.estado        ?? '').toString().trim();

    const resultado = await agendaService.obtenerAgendas({ pagina, limite, busqueda, id_odontologo, fecha, estado });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

const obtenerDisponibles = async (req, res, next) => {
  try {
    const id_odontologo = (req.query.id_odontologo ?? '').toString().trim();
    const fecha         = (req.query.fecha         ?? '').toString().trim();

    const resultado = await agendaService.obtenerDisponibles({ id_odontologo, fecha });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

const obtenerPorId = async (req, res, next) => {
  try {
    const horario = await agendaService.obtenerAgendaPorId(req.params.id);
    res.json(horario);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const horario = await agendaService.actualizarAgenda(req.params.id, req.body);
    res.json(horario);
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const horario = await agendaService.cambiarEstadoAgenda(req.params.id, req.body.estado);
    res.json(horario);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crear,
  obtenerTodos,
  obtenerDisponibles,
  obtenerPorId,
  actualizar,
  cambiarEstado,
};
