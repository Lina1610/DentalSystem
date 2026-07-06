// =========================================================
// SERVICE: paciente.service.js
// Lógica de negocio para pacientes
// =========================================================

const Paciente = require('../models/patient.model');
const { NotFoundError, ConflictError } = require('../helpers/errors');

// ---------------------------------------------------------
// Crear paciente
// ---------------------------------------------------------
const crearPaciente = async (data) => {
  const duplicado = await Paciente.existeDuplicado(data.documento, data.email);
  if (duplicado) {
    throw new ConflictError('Ya existe un paciente con ese documento o email');
  }

  return Paciente.create(data);
};

// ---------------------------------------------------------
// Obtener todos los pacientes activos (con paginación)
// ---------------------------------------------------------
const obtenerPacientes = async ({ pagina = 1, limite = 10, busqueda = '', estado = '' } = {}) => {
  const offset = (pagina - 1) * limite;
  return Paciente.findAll({ limite, offset, busqueda, estado });
};

// ---------------------------------------------------------
// Obtener paciente por ID
// ---------------------------------------------------------
const obtenerPacientePorId = async (id) => {
  const paciente = await Paciente.findById(id);
  if (!paciente) {
    throw new NotFoundError('Paciente no encontrado');
  }
  return paciente;
};

// ---------------------------------------------------------
// Actualizar paciente
// ---------------------------------------------------------
const actualizarPaciente = async (id, data) => {
  await obtenerPacientePorId(id);

  if (data.documento || data.email) {
    const duplicado = await Paciente.existeDuplicado(data.documento, data.email, id);
    if (duplicado) {
      throw new ConflictError('El documento o email ya está en uso por otro paciente');
    }
  }

  return Paciente.update(id, data);
};

// ---------------------------------------------------------
// Eliminar lógico (soft delete)
// ---------------------------------------------------------
const eliminarPaciente = async (id) => {
  await obtenerPacientePorId(id);
  await Paciente.softDelete(id);
  return { message: 'Paciente desactivado correctamente' };
};

// ---------------------------------------------------------
// Buscar por documento
// ---------------------------------------------------------
const buscarPorDocumento = async (documento) => {
  const paciente = await Paciente.findByDocumento(documento);
  if (!paciente) {
    throw new NotFoundError('Paciente no encontrado');
  }
  return paciente;
};

// ---------------------------------------------------------
// Activar / Desactivar paciente
// ---------------------------------------------------------
const cambiarEstadoPaciente = async (id) => {
  const paciente = await Paciente.toggleEstado(id);
  if (!paciente) {
    throw new NotFoundError('Paciente no encontrado');
  }
  return paciente;
};

module.exports = {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  eliminarPaciente,
  buscarPorDocumento,
  cambiarEstadoPaciente,
};