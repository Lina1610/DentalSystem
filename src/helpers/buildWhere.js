'use strict';

/**
 * Construye una cláusula WHERE dinámica para mysql2/promise.
 *
 * @param {object} options
 * @param {object}   options.filtros          - Objeto con los filtros a aplicar.
 * @param {string}  [options.filtros.busqueda] - Término de búsqueda global (LIKE).
 * @param {object}  [options.filtros.exactos]  - Pares campo→valor para filtros exactos.
 * @param {string[]} options.searchableFields  - Campos sobre los que se aplica el LIKE.
 *
 * @returns {{ where: string, params: any[] }}
 *
 * @example
 * const { where, params } = buildWhere({
 *   filtros: {
 *     busqueda: 'juan',
 *     exactos: { estado: 'ACTIVO' },
 *   },
 *   searchableFields: ['u.nombres', 'u.apellidos', 'u.documento'],
 * });
 * // where  → "WHERE (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.documento LIKE ?) AND estado = ?"
 * // params → ['%juan%', '%juan%', '%juan%', 'ACTIVO']
 */
function buildWhere({ filtros = {}, searchableFields = [] } = {}) {
  const condiciones = [];
  const params = [];

  // ── Búsqueda global LIKE ──────────────────────────────────
  const termino = filtros.busqueda?.trim();
  if (termino && searchableFields.length > 0) {
    const like = `%${termino}%`;
    const likeCondiciones = searchableFields.map(campo => `${campo} LIKE ?`);
    condiciones.push(`(${likeCondiciones.join(' OR ')})`);
    searchableFields.forEach(() => params.push(like));
  }

  // ── Filtros exactos ───────────────────────────────────────
  const exactos = filtros.exactos ?? {};
  for (const [campo, valor] of Object.entries(exactos)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      condiciones.push(`${campo} = ?`);
      params.push(valor);
    }
  }

  const where = condiciones.length
    ? `WHERE ${condiciones.join(' AND ')}`
    : '';

  return { where, params };
}

module.exports = { buildWhere };
