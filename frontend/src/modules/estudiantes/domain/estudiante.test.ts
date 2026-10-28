import { DatosDeEstudianteInvalidos, nombreCompleto, validarNuevoEstudiante, type NuevoEstudiante } from './estudiante'

const valido: NuevoEstudiante = {
  nombres: ' Luis ',
  apellidos: 'Pérez ',
  grado: ' 5° ',
  documentoIdentidad: ' 123 ',
  fechaNacimiento: '2016-04-10',
  autorizaTratamientoDatos: true,
}

describe('validarNuevoEstudiante', () => {
  it('limpia los espacios y devuelve los datos', () => {
    expect(validarNuevoEstudiante(valido)).toMatchObject({
      nombres: 'Luis',
      apellidos: 'Pérez',
      grado: '5°',
      documentoIdentidad: '123',
    })
  })

  it('exige nombres y apellidos', () => {
    const error = capturar({ ...valido, nombres: '  ', apellidos: '' })
    expect(error.campos).toMatchObject({
      nombres: expect.any(String) as string,
      apellidos: expect.any(String) as string,
    })
  })

  it('exige la autorización de tratamiento de datos del menor', () => {
    const error = capturar({ ...valido, autorizaTratamientoDatos: false })
    expect(error.campos.autorizaTratamientoDatos).toMatch(/autorizar/i)
  })

  it('rechaza una fecha de nacimiento futura', () => {
    const error = capturar({ ...valido, fechaNacimiento: '2999-01-01' })
    expect(error.campos.fechaNacimiento).toBeDefined()
  })

  it('la fecha de nacimiento y el documento son opcionales', () => {
    expect(() => validarNuevoEstudiante({ ...valido, fechaNacimiento: null, documentoIdentidad: '' })).not.toThrow()
  })
})

describe('nombreCompleto', () => {
  it('une nombres y apellidos sin espacios sobrantes', () => {
    expect(nombreCompleto('Luis', 'Pérez')).toBe('Luis Pérez')
    expect(nombreCompleto('Luis', '')).toBe('Luis')
  })
})

function capturar(datos: NuevoEstudiante): DatosDeEstudianteInvalidos {
  try {
    validarNuevoEstudiante(datos)
  } catch (error) {
    if (error instanceof DatosDeEstudianteInvalidos) return error
    throw error
  }
  throw new Error('se esperaba DatosDeEstudianteInvalidos')
}
