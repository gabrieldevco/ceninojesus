import { describe, expect, it } from 'vitest'
import { formatearFecha, formatearFechaHora } from './fecha'

describe('fechas', () => {
  it('formatea una fecha sin hora', () => {
    expect(formatearFecha('2026-10-03')).toBe('03 oct 2026')
  })

  it('formatea fecha y hora en la hora local', () => {
    const local = new Date(2026, 9, 3, 9, 5)
    expect(formatearFechaHora(local.toISOString())).toBe('03 oct 2026, 09:05')
  })

  it('si no es una fecha válida, se comporta como formatearFecha', () => {
    expect(formatearFechaHora('2026-10-03x')).toBe(formatearFecha('2026-10-03x'))
  })
})
