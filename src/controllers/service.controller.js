const service = require("../services/services.service");

const crear = async (req, res, next) => {
  try {
    const serviceResult = await service.crearService(req.body);
    res.status(201).json(serviceResult);
  } catch (error) {
    next(error);
  }
};

const obtenerTodos = async (req, res, next) => {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const limite = Number(req.query.limite) || 10;
    const busqueda = (req.query.busqueda ?? "").toString().trim();
    const estado = (req.query.estado ?? "").toString().trim();
    const resultado = await service.obtenerServices({
      pagina,
      limite,
      busqueda,
      estado,
    });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

const obtenerPorNombre = async (req, res, next) => {
  try {
    const serviceResult = await service.obtenerServicePorNombre(
      req.params.nombre,
    );
    res.json(serviceResult);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const serviceResult = await service.actualizarService(
      req.params.id,
      req.body,
    );
    res.json(serviceResult);
  } catch (error) {
    next(error);
  }
};
const eliminar = async (req, res, next) => {
  try {
    const serviceResult = await service.eliminarService(req.params.id);
    res.json(serviceResult);
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const serviceResult = await service.cambiarEstadoService(req.params.id);
    res.json(serviceResult);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crear,
  obtenerTodos,
  obtenerPorNombre,
  actualizar,
  eliminar,
  cambiarEstado,
};
