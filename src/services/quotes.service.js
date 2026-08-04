const Quotes = require('../models/quotes.model');
const { NotFoundError, ConflictError } = require('../helpers/errors');

const crearQuotes = async (data) => {
  const conflict = await Quotes.existeConflictoHorario(
    data.id_odontologo,
    data.fecha_inicio,
    data.fecha_fin
  );
  if (conflict) {
    throw new ConflictError('La cita entra en conflicto con otra cita existente para el mismo odontólogo');
  }

  return Quotes.create(data);
};

const obtenerQuotes = async ({ pagina = 1, limite = 10, busqueda = '', estado = '', id_paciente = '', id_odontologo = '' } = {}) => {
  const offset = (pagina - 1) * limite;
  return Quotes.findAll({ limite, offset, busqueda, estado, id_paciente, id_odontologo });
};

const obtenerQuotesPorId = async (id) => {
  const quote = await Quotes.findById(id);
  if (!quote) {
    throw new NotFoundError('Cita no encontrada');
  }
  return quote;
};

const actualizarQuotes = async (id, data) => {
  await obtenerQuotesPorId(id);

  if (data.id_odontologo && (data.fecha_inicio || data.fecha_fin)) {
    const conflict = await Quotes.existeConflictoHorario(
      data.id_odontologo,
      data.fecha_inicio,
      data.fecha_fin,
      id
    );
    if (conflict) {
      throw new ConflictError('La cita entra en conflicto con otra cita existente para el mismo odontólogo');
    }
  }

  return Quotes.update(id, data);
};

const eliminarQuotes = async (id, observaciones = null) => {
  await obtenerQuotesPorId(id);
  await Quotes.cancelar(id, observaciones);
  return { message: 'Cita cancelada correctamente' };
};

const cambiarEstadoQuote = async (id, estado) => {
  await obtenerQuotesPorId(id);
  return Quotes.cambiarEstado(id, estado);
};

module.exports = {
  crearQuotes,
  obtenerQuotes,
  obtenerQuotesPorId,
  actualizarQuotes,
  eliminarQuotes,
  cambiarEstadoQuote,
};