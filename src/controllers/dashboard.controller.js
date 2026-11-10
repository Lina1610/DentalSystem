const dashboard = require('../services/dashboard.service');


const obtenerResumen = async (req, res, next) => {
  try {
    const periodo = (req.query.periodo ?? '').toString().trim() || undefined;
    const desde   = (req.query.desde   ?? '').toString().trim() || undefined;
    const hasta   = (req.query.hasta   ?? '').toString().trim() || undefined;

    const resumen = await dashboard.obtenerResumen({ periodo, desde, hasta });
    res.json(resumen);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerResumen,
};
