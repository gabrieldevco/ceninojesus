const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-10-03" -> "03 oct 2026" */
export function formatearFecha(iso: string): string {
  const [anio = '', mes = '1', dia = ''] = iso.split('-')
  return `${dia} ${MESES[Number(mes) - 1] ?? ''} ${anio}`
}

/** "2026-10-03T15:10:00Z" -> "03 oct 2026, 10:10" (hora local del navegador) */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return formatearFecha(iso)
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${dos(fecha.getDate())} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}, ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`
}
