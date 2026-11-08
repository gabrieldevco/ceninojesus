import { describe, expect, it } from 'vitest'
import {
  CalificacionInvalida,
  EntregaInvalida,
  estadoDeTarea,
  hoyIso,
  leerCalificacion,
  resumenEntregas,
  validarNuevaEntrega,
  type Entrega,
} from './entrega'

const entrega = (extra: Partial<Entrega> = {}): Entrega => ({
  id: 1,
  actividadId: 1,
  estudianteId: 9,
  estudianteNombre: 'Luis',
  texto: 'Mi trabajo',
  url: '',
  tieneArchivo: false,
  archivoNombre: '',
  fechaEntrega: '2026-10-05T15:00:00Z',
  tarde: false,
  calificacion: null,
  comentarioDocente: '',
  fechaCalificacion: null,
  ...extra,
})

describe('estadoDeTarea', () => {
  it('sin entrega: asignada antes de la fecha y vencida después (vence al final del día)', () => {
    expect(estadoDeTarea({ fechaEntrega: '2026-10-08' }, undefined, '2026-10-08')).toBe('asignada')
    expect(estadoDeTarea({ fechaEntrega: '2026-10-08' }, undefined, '2026-10-09')).toBe('vencida')
    expect(estadoDeTarea({ fechaEntrega: null }, undefined, '2030-01-01')).toBe('asignada')
  })

  it('con entrega: entregada, tarde o calificada', () => {
    expect(estadoDeTarea({ fechaEntrega: '2026-10-08' }, entrega())).toBe('entregada')
    expect(estadoDeTarea({ fechaEntrega: '2026-10-08' }, entrega({ tarde: true }))).toBe('tarde')
    expect(estadoDeTarea({ fechaEntrega: '2026-10-08' }, entrega({ calificacion: 0 }))).toBe('calificada')
  })

  it('hoyIso usa la fecha local', () => {
    expect(hoyIso(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('validarNuevaEntrega', () => {
  const base = { grupoId: 1, actividadId: 1, texto: '', url: '', archivo: null }

  it('exige texto, archivo o enlace', () => {
    expect(() => validarNuevaEntrega(base)).toThrow(EntregaInvalida)
    expect(validarNuevaEntrega({ ...base, texto: '  hola  ' }).texto).toBe('hola')
    // Si ya había subido un archivo, puede reentregar solo cambiando el texto
    expect(() => validarNuevaEntrega(base, true)).not.toThrow()
  })

  it('rechaza enlaces que no son http(s)', () => {
    expect(() => validarNuevaEntrega({ ...base, url: 'javascript:alert(1)' })).toThrow(/http/)
  })
})

describe('leerCalificacion', () => {
  it('acepta coma o punto y vacío como sin nota', () => {
    expect(leerCalificacion('4,5')).toBe(4.5)
    expect(leerCalificacion('5')).toBe(5)
    expect(leerCalificacion('0.0')).toBe(0)
    expect(leerCalificacion('  ')).toBeNull()
  })

  it('rechaza notas fuera de 0.0 a 5.0 o con más de un decimal', () => {
    for (const nota of ['5.5', '6', '-1', '4.55', 'abc']) expect(() => leerCalificacion(nota)).toThrow(CalificacionInvalida)
  })
})

describe('resumenEntregas', () => {
  it('cuenta las entregas, las que faltan por calificar y el promedio', () => {
    expect(resumenEntregas([entrega({ calificacion: 4 }), entrega({ calificacion: 4.5 }), entrega()])).toEqual({
      total: 3,
      porCalificar: 1,
      promedio: 4.3,
    })
    expect(resumenEntregas([]).promedio).toBeNull()
  })
})
