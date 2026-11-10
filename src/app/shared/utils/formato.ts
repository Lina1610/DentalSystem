// Formatos de presentación compartidos (convención colombiana)

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// 100000 → "$ 100.000"
export function formatearMoneda(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : formatoCOP.format(valor);
}

// 1250000 → "$ 1,3 M", 85000 → "$ 85 mil" (para etiquetas cortas de gráficas)
export function formatearMonedaCorta(valor: number): string {
  if (valor >= 1_000_000) {
    return `$ ${(valor / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
  }
  if (valor >= 1_000) {
    return `$ ${Math.round(valor / 1_000).toLocaleString('es-CO')} mil`;
  }
  return formatearMoneda(valor);
}
