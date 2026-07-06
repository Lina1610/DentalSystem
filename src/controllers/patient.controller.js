const pacienteService = require('../services/patient.service');

// ---------------------------------------------------------
// POST /pacientes
// ---------------------------------------------------------
const crear = async (req, res, next) => {
  try {
    const paciente = await pacienteService.crearPaciente(req.body);
    res.status(201).json(paciente);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// GET /pacientes
// ---------------------------------------------------------
const obtenerTodos = async (req, res, next) => {
  try {
    const pagina   = Number(req.query.pagina)  || 1;
    const limite   = Number(req.query.limite)  || 10;
    const busqueda = (req.query.busqueda ?? '').toString().trim();
    const estado   = (req.query.estado   ?? '').toString().trim();
    const resultado = await pacienteService.obtenerPacientes({ pagina, limite, busqueda, estado });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// GET /pacientes/:id
// ---------------------------------------------------------
const obtenerPorId = async (req, res, next) => {
  try {
    const paciente = await pacienteService.obtenerPacientePorId(req.params.id);
    res.json(paciente);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// PUT /pacientes/:id
// ---------------------------------------------------------
const actualizar = async (req, res, next) => {
  try {
    const paciente = await pacienteService.actualizarPaciente(
      req.params.id,
      req.body
    );
    res.json(paciente);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// DELETE /pacientes/:id
// ---------------------------------------------------------
const eliminar = async (req, res, next) => {
  try {
    const resultado = await pacienteService.eliminarPaciente(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// GET /pacientes/documento/:documento
// ---------------------------------------------------------
const buscarPorDocumento = async (req, res, next) => {
  try {
    const paciente = await pacienteService.buscarPorDocumento(
      req.params.documento
    );
    res.json(paciente);
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// PATCH /pacientes/:id/estado
// ---------------------------------------------------------
const cambiarEstado = async (req, res, next) => {
  try {
    const resultado = await pacienteService.cambiarEstadoPaciente(req.params.id);
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
  eliminar,
  buscarPorDocumento,
  cambiarEstado,
};