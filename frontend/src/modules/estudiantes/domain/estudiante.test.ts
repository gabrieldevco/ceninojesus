import {
  AccesoInvalido,
  DatosDeEstudianteInvalidos,
  nombreCompleto,
  validarNuevaClave,
  validarNuevoAcceso,
  validarNuevoEstudiante,
  type NuevoAcceso,
  type NuevoEstudiante,
} from './estudiante'

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

describe('validarNuevoAcceso', () => {
  const acceso = { nombreUsuario: ' luis ', clave: 'Clave-segura-1', confirmacion: 'Clave-segura-1' }

  it('limpia el usuario y devuelve los datos', () => {
    expect(validarNuevoAcceso(acceso)).toMatchObject({ nombreUsuario: 'luis' })
  })

  it('exige un usuario sin espacios', () => {
    expect(capturarAcceso({ ...acceso, nombreUsuario: '  ' }).campos.nombreUsuario).toBeDefined()
    expect(capturarAcceso({ ...acceso, nombreUsuario: 'luis perez' }).campos.nombreUsuario).toMatch(/espacios/)
  })

  it('exige una contraseña de al menos 8 caracteres que no sea solo números', () => {
    expect(capturarAcceso({ ...acceso, clave: 'corta1', confirmacion: 'corta1' }).campos.clave).toMatch(/8 caracteres/)
    expect(capturarAcceso({ ...acceso, clave: '12345678', confirmacion: '12345678' }).campos.clave).toMatch(/solo números/)
  })

  it('exige que la confirmación coincida', () => {
    expect(capturarAcceso({ ...acceso, confirmacion: 'Otra-clave-2' }).campos.confirmacion).toMatch(/no coinciden/)
  })
})

describe('validarNuevaClave', () => {
  it('devuelve la contraseña si cumple, y falla si no', () => {
    expect(validarNuevaClave('Clave-segura-1', 'Clave-segura-1')).toBe('Clave-segura-1')
    expect(() => validarNuevaClave('corta', 'corta')).toThrow(AccesoInvalido)
  })
})

function capturarAcceso(acceso: NuevoAcceso): AccesoInvalido {
  try {
    validarNuevoAcceso(acceso)
  } catch (error) {
    if (error instanceof AccesoInvalido) return error
    throw error
  }
  throw new Error('se esperaba AccesoInvalido')
}
