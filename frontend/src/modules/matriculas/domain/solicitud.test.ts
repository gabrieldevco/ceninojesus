import {
  buscarDuplicada,
  contarPorEstado,
  MotivoRequerido,
  validarMotivoRechazo,
  type SolicitudMatricula,
} from './solicitud'

const base: SolicitudMatricula = {
  id: 1,
  estudiante: 'Ana',
  acudiente: 'Marta',
  correo: 'marta@example.com',
  grupo: 'Ajedrez',
  fecha: '2026-10-01',
  estado: 'pendiente',
}
const nueva = { estudiante: 'Ana', acudiente: 'Marta', correo: 'marta@example.com', grupo: 'Ajedrez' }

describe('buscarDuplicada', () => {
  it('detecta una solicitud pendiente o aprobada del mismo estudiante y grupo', () => {
    expect(buscarDuplicada([base], nueva)).toBe(base)
    expect(buscarDuplicada([{ ...base, estado: 'aprobada' }], nueva)).toBeDefined()
  })

  it('permite volver a solicitar tras un rechazo', () => {
    expect(buscarDuplicada([{ ...base, estado: 'rechazada' }], nueva)).toBeUndefined()
  })

  it('no confunde otro estudiante ni otro grupo', () => {
    expect(buscarDuplicada([base], { ...nueva, estudiante: 'Luis' })).toBeUndefined()
    expect(buscarDuplicada([base], { ...nueva, grupo: 'Robótica' })).toBeUndefined()
  })
})

describe('validarMotivoRechazo', () => {
  it('exige un motivo de al menos 5 caracteres', () => {
    expect(() => validarMotivoRechazo('   ab ')).toThrow(MotivoRequerido)
    expect(validarMotivoRechazo('  Cupo lleno  ')).toBe('Cupo lleno')
  })
})

describe('contarPorEstado', () => {
  it('cuenta por estado', () => {
    const lista = [base, { ...base, id: 2, estado: 'aprobada' as const }, { ...base, id: 3 }]
    expect(contarPorEstado(lista, 'pendiente')).toBe(2)
    expect(contarPorEstado(lista, 'rechazada')).toBe(0)
  })
})
