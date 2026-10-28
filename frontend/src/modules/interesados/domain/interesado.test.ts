import {
  contarPorEstado,
  InteresadoInvalido,
  NotaRequerida,
  transicionesPermitidas,
  validarNota,
  validarNuevoInteresado,
  type Interesado,
  type NuevoInteresado,
} from './interesado'

const valido: NuevoInteresado = {
  nombreCompleto: '  María López ',
  correo: ' maria@example.com ',
  telefono: ' 300 123 4567 ',
  nombreAspirante: ' Luis ',
  gradoInteres: 'Primaria',
  mensaje: ' ¿Hay cupos? ',
  autorizaTratamientoDatos: true,
}

function camposDe(datos: NuevoInteresado) {
  try {
    validarNuevoInteresado(datos)
  } catch (error) {
    if (error instanceof InteresadoInvalido) return error.campos
    throw error
  }
  throw new Error('se esperaba InteresadoInvalido')
}

describe('validarNuevoInteresado', () => {
  it('limpia los espacios y devuelve los datos', () => {
    expect(validarNuevoInteresado(valido)).toMatchObject({
      nombreCompleto: 'María López',
      correo: 'maria@example.com',
      telefono: '300 123 4567',
      nombreAspirante: 'Luis',
      mensaje: '¿Hay cupos?',
    })
  })

  it('exige nombre, correo válido y teléfono', () => {
    const campos = camposDe({ ...valido, nombreCompleto: ' ', correo: 'no-es-correo', telefono: '12' })
    expect(campos.nombreCompleto).toBeDefined()
    expect(campos.correo).toBeDefined()
    expect(campos.telefono).toMatch(/7 dígitos/)
  })

  it('cuenta los dígitos del teléfono ignorando separadores', () => {
    expect(() => validarNuevoInteresado({ ...valido, telefono: '+57 (300) 123-4567' })).not.toThrow()
  })

  it('exige la autorización de tratamiento de datos', () => {
    expect(camposDe({ ...valido, autorizaTratamientoDatos: false }).autorizaTratamientoDatos).toMatch(/autorizar/i)
  })

  it('el nombre del aspirante y el mensaje son opcionales', () => {
    expect(() => validarNuevoInteresado({ ...valido, nombreAspirante: '', mensaje: '' })).not.toThrow()
  })
})

describe('transicionesPermitidas', () => {
  it('desde nuevo se puede ir a cualquier otro estado', () => {
    expect(transicionesPermitidas('nuevo')).toEqual(['en_seguimiento', 'matriculado', 'descartado'])
  })

  it('desde en seguimiento solo a matriculado o descartado', () => {
    expect(transicionesPermitidas('en_seguimiento')).toEqual(['matriculado', 'descartado'])
  })

  it('matriculado y descartado son estados finales', () => {
    expect(transicionesPermitidas('matriculado')).toEqual([])
    expect(transicionesPermitidas('descartado')).toEqual([])
  })
})

describe('validarNota', () => {
  it('exige texto y lo devuelve sin espacios sobrantes', () => {
    expect(validarNota('  Se llamó  ')).toBe('Se llamó')
    expect(() => validarNota('   ')).toThrow(NotaRequerida)
  })
})

describe('contarPorEstado', () => {
  it('cuenta los interesados de cada estado', () => {
    const base = { nombreCompleto: '', correo: '', telefono: '', mensaje: '', nombreAspirante: '', gradoInteres: '', fechaRegistro: '', fechaUltimoContacto: null }
    const lista: Interesado[] = [
      { ...base, id: 1, estado: 'nuevo' },
      { ...base, id: 2, estado: 'nuevo' },
      { ...base, id: 3, estado: 'descartado' },
    ]
    expect(contarPorEstado(lista, 'nuevo')).toBe(2)
    expect(contarPorEstado(lista, 'matriculado')).toBe(0)
  })
})
