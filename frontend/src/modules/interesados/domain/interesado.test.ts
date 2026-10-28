import { InteresadoInvalido, validarNuevoInteresado, type NuevoInteresado } from './interesado'

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
