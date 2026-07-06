const dentistaService = require('../services/dentist.service');

const crear = async (req, res, next) => {
  try {
    const dentista = await dentistaService.crearOdontologo(req.body);
    res.status(201).json(dentista);
  } catch (error) {
    next(error);
  }
};

const obtenerTodos = async (req, res, next) => {
  try {
    const pagina   = Number(req.query.pagina)  || 1;
    const limite   = Number(req.query.limite)  || 10;
    const busqueda = (req.query.busqueda ?? '').toString().trim();
    const estado   = (req.query.estado   ?? '').toString().trim();
    const resultado = await dentistaService.obtenerOdontologos({ pagina, limite, busqueda, estado });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

const obtenerPorId = async (req, res, next) => {
  try {
    const dentista = await dentistaService.obtenerOdontologoPorId(req.params.id);
    res.json(dentista);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const dentista = await dentistaService.actualizarOdontologo(
      req.params.id,
      req.body
    );
    res.json(dentista);
  } catch (error) {
    next(error);
  }
};

const buscarPorDocumento = async (req, res, next) => {
  try {
    const dentista = await dentistaService.buscarPorDocumento(
      req.params.documento
    );
    res.json(dentista);
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const resultado = await dentistaService.cambiarEstadoOdontologo(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crear,
  obtenerTodos,
  obtenerPorId,
  actualizar,
  buscarPorDocumento,
  cambiarEstado,
};

