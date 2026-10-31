import {
  RegistroInvalido,
  RestablecimientoInvalido,
  validarNuevoAcudiente,
  validarRestablecimiento,
  type NuevoAcudiente,
} from './registro'

const valido: NuevoAcudiente = {
  nombreUsuario: ' maria ',
  nombres: ' María ',
  apellidos: ' López ',
  correo: ' maria@example.com ',
  telefono: ' 3001234567 ',
  clave: 'Clave-segura-1',
  confirmacion: 'Clave-segura-1',
  autorizaTratamientoDatos: true,
}

function camposDe(datos: NuevoAcudiente) {
  try {
    validarNuevoAcudiente(datos)
  } catch (error) {
    if (error instanceof RegistroInvalido) return error.campos
    throw error
  }
  throw new Error('se esperaba RegistroInvalido')
}

describe('validarNuevoAcudiente', () => {
  it('limpia los espacios y devuelve los datos', () => {
    expect(validarNuevoAcudiente(valido)).toMatchObject({
      nombreUsuario: 'maria',
      nombres: 'María',
      apellidos: 'López',
      correo: 'maria@example.com',
      telefono: '3001234567',
    })
  })

  it('exige nombres, apellidos, usuario sin espacios y un correo válido', () => {
    const campos = camposDe({ ...valido, nombres: ' ', apellidos: '', nombreUsuario: 'maria lopez', correo: 'no-es-correo' })
    expect(campos.nombres).toBeDefined()
    expect(campos.apellidos).toBeDefined()
    expect(campos.nombreUsuario).toMatch(/espacios/)
    expect(campos.correo).toBeDefined()
  })

  it('exige una contraseña de al menos 8 caracteres, no solo números, y que coincida', () => {
    expect(camposDe({ ...valido, clave: 'corta1', confirmacion: 'corta1' }).clave).toMatch(/8 caracteres/)
    expect(camposDe({ ...valido, clave: '12345678', confirmacion: '12345678' }).clave).toMatch(/solo números/)
    expect(camposDe({ ...valido, confirmacion: 'Otra-clave-2' }).confirmacion).toMatch(/no coinciden/)
  })

  it('exige la autorización de tratamiento de datos y deja el teléfono opcional', () => {
    expect(camposDe({ ...valido, autorizaTratamientoDatos: false }).autorizaTratamientoDatos).toMatch(/autorizar/i)
    expect(() => validarNuevoAcudiente({ ...valido, telefono: '' })).not.toThrow()
  })
})

describe('validarRestablecimiento', () => {
  const datos = { uid: 'Mw', token: 'abc-123', clave: 'Clave-segura-1', confirmacion: 'Clave-segura-1' }

  it('acepta una contraseña válida y conserva los datos del enlace', () => {
    expect(validarRestablecimiento(datos)).toEqual(datos)
  })

  it('rechaza contraseñas débiles o que no coinciden', () => {
    expect(() => validarRestablecimiento({ ...datos, clave: 'corta', confirmacion: 'corta' })).toThrow(RestablecimientoInvalido)
    expect(() => validarRestablecimiento({ ...datos, confirmacion: 'Otra-clave-2' })).toThrow(RestablecimientoInvalido)
  })
})
