const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-10-03" -> "03 oct 2026" */
export function formatearFecha(iso: string): string {
  const [anio = '', mes = '1', dia = ''] = iso.split('-')
  return `${dia} ${MESES[Number(mes) - 1] ?? ''} ${anio}`
}
