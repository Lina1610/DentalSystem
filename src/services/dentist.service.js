const Dentista = require("../models/dentist.model");
const { NotFoundError, ConflictError } = require("../helpers/errors");

const crearDentista = async (data) => {
  const duplicado = await Dentista.existeDuplicado(data.documento, data.email);
  if (duplicado) {
    throw new ConflictError("Ya existe un dentista con ese documento o email");
  }

  return Dentista.create(data);
};
const obtenerDentistas = async ({
  pagina = 1,
  limite = 10,
  busqueda = "",
  estado = "",
} = {}) => {
  const offset = (pagina - 1) * limite;
  return Dentista.findAll({ limite, offset, busqueda, estado });
};

const obtenerDentistaPorId = async (id) => {
  const dentista = await Dentista.findById(id);
  if (!dentista) {
    throw new NotFoundError("Dentista no encontrado");
  }
  return dentista;
};

const actualizarDentista = async (id, data) => {
  await obtenerDentistaPorId(id);

  if (data.documento || data.email) {
    const duplicado = await Dentista.existeDuplicado(
      data.documento,
      data.email,
      id,
    );
    if (duplicado) {
      throw new ConflictError(
        "El documento o email ya está en uso por otro dentista",
      );
    }
  }
  return Dentista.update(id, data);
};

const eliminarDentista = async (id) => {
  await obtenerDentistaPorId(id);
  await Dentista.softDelete(id);
  return { message: "Dentista desactivado correctamente" };
};

const buscarPorDocumento = async (documento) => {
  const dentista = await Dentista.findByDocumento(documento);
  if (!dentista) {
    throw new NotFoundError("Dentista no encontrado");
  }
  return dentista;
};

const cambiarEstadoDentista = async (id) => {
  const dentista = await Dentista.toggleEstado(id);
  if (!dentista) {
    throw new NotFoundError("Dentista no encontrado");
  }
  return dentista;
};

module.exports = {
  crearOdontologo:          crearDentista,
  obtenerOdontologos:       obtenerDentistas,
  obtenerOdontologoPorId:   obtenerDentistaPorId,
  actualizarOdontologo:     actualizarDentista,
  eliminarOdontologo:       eliminarDentista,
  cambiarEstado:            cambiarEstadoDentista,
  cambiarEstadoOdontologo:  cambiarEstadoDentista,
  buscarPorDocumento,
};
