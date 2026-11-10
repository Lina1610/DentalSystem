const Dentista = require("../models/dentist.model");
const { NotFoundError, ConflictError, ValidationError } = require("../helpers/errors");
const { hashPassword, problemasDePolitica } = require("../helpers/password");
const { ROLES } = require("../middlewares/roles.middleware");

const crearDentista = async (data) => {
  // Defensa en profundidad: el guard ya valida, pero el servicio no confía en que
  // siempre lo llamen a través de esa ruta.
  const problemas = problemasDePolitica(data.password, data);
  if (problemas.length > 0) {
    throw new ValidationError(problemas.join(". "));
  }

  const duplicado = await Dentista.existeDuplicado({
    documento: data.documento,
    email: data.email,
    username: data.username,
  });
  if (duplicado) {
    throw new ConflictError("Ya existe un usuario con ese documento, email o nombre de usuario");
  }

  const passwordHash = await hashPassword(data.password);

  return Dentista.create({
    id_rol: ROLES.ODONTOLOGO,
    nombres: data.nombres,
    apellidos: data.apellidos,
    documento: data.documento,
    telefono: data.telefono,
    email: data.email,
    username: data.username,
    password_hash: passwordHash,
    id_especialidad: data.id_especialidad,
    id_consultorio: data.id_consultorio,
    tarjeta_profesional: data.tarjeta_profesional,
    experiencia_anios: data.experiencia_anios,
  });
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
    const duplicado = await Dentista.existeDuplicado({
      documento: data.documento,
      email: data.email,
      excludeIdOdontologo: id,
    });
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
