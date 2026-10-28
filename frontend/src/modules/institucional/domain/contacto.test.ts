import { MensajeInvalido, validarNuevoMensaje, type NuevoMensaje } from './contacto'

const VALIDO: NuevoMensaje = {
  nombre: '  María López ',
  correo: ' maria@example.com ',
  telefono: ' 3001234567 ',
  asunto: ' Horarios ',
  mensaje: ' ¿Cuál es el horario? ',
  autorizaTratamientoDatos: true,
}

describe('validarNuevoMensaje', () => {
  it('limpia los espacios de un mensaje válido', () => {
    expect(validarNuevoMensaje(VALIDO)).toEqual({
      nombre: 'María López',
      correo: 'maria@example.com',
      telefono: '3001234567',
      asunto: 'Horarios',
      mensaje: '¿Cuál es el horario?',
      autorizaTratamientoDatos: true,
    })
  })

  it('exige la autorización de datos (Ley 1581)', () => {
    expect(() => validarNuevoMensaje({ ...VALIDO, autorizaTratamientoDatos: false })).toThrow(MensajeInvalido)
  })

  it('reporta todos los campos inválidos a la vez', () => {
    try {
      validarNuevoMensaje({ ...VALIDO, nombre: ' ', correo: 'x', asunto: '', mensaje: '' })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(MensajeInvalido)
      expect(Object.keys((error as MensajeInvalido).campos).sort()).toEqual(['asunto', 'correo', 'mensaje', 'nombre'])
    }
  })

  it('el teléfono es opcional', () => {
    expect(validarNuevoMensaje({ ...VALIDO, telefono: '' }).telefono).toBe('')
  })
})
