const Service = require('../models/service.model');
const { NotFoundError, ConflictError } = require('../helpers/errors');

const crearService= async (data) => {
  const duplicado = await Service.existeDuplicado(data.nombre);
  if (duplicado) {
    throw new ConflictError('Ya existe un servicio con ese nombre');
  }

  return Service.create(data);
};

const obtenerServices = async ({ pagina = 1, limite = 10, busqueda = '', estado = '' } = {}) => {
  const offset = (pagina - 1) * limite;
  return Service.findAll({ limite, offset, busqueda, estado });
};

const obtenerServicePorId = async (id) => {
  const service = await Service.findById(id);
  if (!service) {
    throw new NotFoundError('Servicio no encontrado');
  }
  return service;
};

const actualizarService = async (id, data) => {
  await obtenerServicePorId(id);

  if (data.nombre) {
    const duplicado = await Service.existeDuplicado(data.nombre, id);
    if (duplicado) {
      throw new ConflictError('Ya existe un servicio con ese nombre');
    }
  }

  return Service.update(id, data);
};

const eliminarService = async (id) => {
  await obtenerServicePorId(id);
  await Service.softDelete(id);
  return { message: 'Servicio desactivado correctamente' };
};

const obtenerServicePorNombre = async (nombre) => {
  const service = await Service.findByNombre(nombre);
  if (!service) {
    throw new NotFoundError('Servicio no encontrado');
  }
  return service;
};

const cambiarEstadoService = async (id) => {
  const service = await Service.toggleEstado(id);
  if (!service) {
    throw new NotFoundError('Servicio no encontrado');
  }
  return service;
};



module.exports = {
  crearService,
  obtenerServices,
  obtenerServicePorId,
  actualizarService,
  eliminarService,
  obtenerServicePorNombre,
  cambiarEstadoService,
};