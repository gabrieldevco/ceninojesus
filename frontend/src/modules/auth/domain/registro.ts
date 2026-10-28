export const CLAVE_MINIMA_CARACTERES = 8

export interface NuevoAcudiente {
  nombreUsuario: string
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  clave: string
  confirmacion: string
  /** El acudiente autoriza el tratamiento de sus datos personales (Ley 1581 de 2012). */
  autorizaTratamientoDatos: boolean
}

export type ErroresDeRegistro = Partial<Record<keyof NuevoAcudiente, string>>

export class RegistroInvalido extends Error {
  constructor(readonly campos: ErroresDeRegistro) {
    super(Object.values(campos)[0] ?? 'Los datos no son válidos')
    this.name = 'RegistroInvalido'
  }
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Mismas exigencias que el backend para la contraseña: largo mínimo y no solo números. */
function errorDeClave(clave: string, confirmacion: string): Pick<ErroresDeRegistro, 'clave' | 'confirmacion'> {
  if (clave.length < CLAVE_MINIMA_CARACTERES) return { clave: `La contraseña debe tener al menos ${CLAVE_MINIMA_CARACTERES} caracteres.` }
  if (/^\d+$/.test(clave)) return { clave: 'La contraseña no puede ser solo números.' }
  if (clave !== confirmacion) return { confirmacion: 'Las contraseñas no coinciden.' }
  return {}
}

export function validarNuevoAcudiente(datos: NuevoAcudiente): NuevoAcudiente {
  const campos: ErroresDeRegistro = { ...errorDeClave(datos.clave, datos.confirmacion) }
  const usuario = datos.nombreUsuario.trim()
  if (!usuario) campos.nombreUsuario = 'Escribe un nombre de usuario.'
  else if (/\s/.test(usuario)) campos.nombreUsuario = 'El nombre de usuario no puede tener espacios.'
  if (!datos.nombres.trim()) campos.nombres = 'Escribe tus nombres.'
  if (!datos.apellidos.trim()) campos.apellidos = 'Escribe tus apellidos.'
  if (!CORREO.test(datos.correo.trim())) campos.correo = 'Escribe un correo válido: lo usaremos para recuperar tu contraseña.'
  if (!datos.autorizaTratamientoDatos) campos.autorizaTratamientoDatos = 'Debes autorizar el tratamiento de tus datos para crear la cuenta.'
  if (Object.keys(campos).length > 0) throw new RegistroInvalido(campos)
  return {
    ...datos,
    nombreUsuario: usuario,
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim(),
    telefono: datos.telefono.trim(),
  }
}

// --- Restablecer la contraseña con el enlace del correo ---

export interface RestablecimientoDeClave {
  /** Datos del enlace que llegó por correo */
  uid: string
  token: string
  clave: string
  confirmacion: string
}

export type ErroresDeRestablecimiento = Partial<Record<'clave' | 'confirmacion', string>>

export class RestablecimientoInvalido extends Error {
  constructor(readonly campos: ErroresDeRestablecimiento) {
    super(Object.values(campos)[0] ?? 'La contraseña no es válida')
    this.name = 'RestablecimientoInvalido'
  }
}

export function validarRestablecimiento(datos: RestablecimientoDeClave): RestablecimientoDeClave {
  const campos = errorDeClave(datos.clave, datos.confirmacion)
  if (Object.keys(campos).length > 0) throw new RestablecimientoInvalido(campos)
  return datos
}
