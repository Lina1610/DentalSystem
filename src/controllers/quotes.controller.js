const quotesService = require('../services/quotes.service');

const crear = async (req, res, next) => {
  try {
    const quote = await quotesService.crearQuotes(req.body);
    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

const obtenerTodos = async (req, res, next) => {
  try {
    const pagina        = Number(req.query.pagina)  || 1;
    const limite        = Number(req.query.limite)  || 10;
    const busqueda      = (req.query.busqueda      ?? '').toString().trim();
    const estado        = (req.query.estado        ?? '').toString().trim();
    const id_paciente   = (req.query.id_paciente   ?? '').toString().trim();
    const id_odontologo = (req.query.id_odontologo ?? '').toString().trim();

    const resultado = await quotesService.obtenerQuotes({ pagina, limite, busqueda, estado, id_paciente, id_odontologo });
    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

const obtenerPorId = async (req, res, next) => {
  try {
    const quote = await quotesService.obtenerQuotesPorId(req.params.id);
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const quote = await quotesService.actualizarQuotes(
      req.params.id,
      req.body
    );
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const observaciones = req.body?.observaciones ?? null;

    const resultado = await quotesService.eliminarQuotes(
      req.params.id,
      observaciones
    );

    res.json(resultado);
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const resultado = await quotesService.cambiarEstadoQuote(req.params.id, req.body.estado);
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
  cambiarEstado,
};