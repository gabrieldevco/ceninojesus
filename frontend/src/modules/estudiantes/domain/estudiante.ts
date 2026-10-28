export interface Estudiante {
  id: number
  nombres: string
  apellidos: string
  /** Nombre completo, para mostrarlo */
  nombre: string
  grado: string
  documentoIdentidad: string
  /** Fecha ISO (AAAA-MM-DD) o `null` si no se registró */
  fechaNacimiento: string | null
  /** Si ya tiene un usuario con el que entra al aula */
  tieneAcceso: boolean
}

export interface NuevoEstudiante {
  nombres: string
  apellidos: string
  grado: string
  documentoIdentidad: string
  fechaNacimiento: string | null
  /** El acudiente autoriza el tratamiento de los datos del menor (Ley 1581 de 2012). */
  autorizaTratamientoDatos: boolean
}

export class DatosDeEstudianteInvalidos extends Error {
  constructor(readonly campos: Partial<Record<keyof NuevoEstudiante, string>>) {
    super(Object.values(campos)[0] ?? 'Los datos del estudiante no son válidos')
    this.name = 'DatosDeEstudianteInvalidos'
  }
}

export function nombreCompleto(nombres: string, apellidos: string): string {
  return `${nombres} ${apellidos}`.trim()
}

/** Reglas que no dependen del servidor: lo que falte se corrige antes de enviar. */
export function validarNuevoEstudiante(datos: NuevoEstudiante, hoy: Date = new Date()): NuevoEstudiante {
  const campos: Partial<Record<keyof NuevoEstudiante, string>> = {}
  if (!datos.nombres.trim()) campos.nombres = 'Escribe los nombres del estudiante.'
  if (!datos.apellidos.trim()) campos.apellidos = 'Escribe los apellidos del estudiante.'
  if (datos.fechaNacimiento && new Date(datos.fechaNacimiento) > hoy) {
    campos.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.'
  }
  if (!datos.autorizaTratamientoDatos) {
    campos.autorizaTratamientoDatos = 'Debes autorizar el tratamiento de los datos del estudiante.'
  }
  if (Object.keys(campos).length > 0) throw new DatosDeEstudianteInvalidos(campos)
  return {
    ...datos,
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    grado: datos.grado.trim(),
    documentoIdentidad: datos.documentoIdentidad.trim(),
  }
}

// --- Acceso del estudiante (RF-06): su propia cuenta para ver el aula ---

export interface NuevoAcceso {
  nombreUsuario: string
  clave: string
  confirmacion: string
}

export type ErroresDeAcceso = Partial<Record<'nombreUsuario' | 'clave' | 'confirmacion', string>>

export class AccesoInvalido extends Error {
  constructor(readonly campos: ErroresDeAcceso) {
    super(Object.values(campos)[0] ?? 'Los datos de acceso no son válidos')
    this.name = 'AccesoInvalido'
  }
}

export const CLAVE_MINIMA_CARACTERES = 8

/** Mismas exigencias que el backend para la contraseña: largo mínimo y no solo números. */
export function validarClave(clave: string, confirmacion: string): ErroresDeAcceso {
  const errores: ErroresDeAcceso = {}
  if (clave.length < CLAVE_MINIMA_CARACTERES) errores.clave = `La contraseña debe tener al menos ${CLAVE_MINIMA_CARACTERES} caracteres.`
  else if (/^\d+$/.test(clave)) errores.clave = 'La contraseña no puede ser solo números.'
  else if (clave !== confirmacion) errores.confirmacion = 'Las contraseñas no coinciden.'
  return errores
}

export function validarNuevoAcceso(acceso: NuevoAcceso): NuevoAcceso {
  const errores = validarClave(acceso.clave, acceso.confirmacion)
  const usuario = acceso.nombreUsuario.trim()
  if (!usuario) errores.nombreUsuario = 'Escribe un nombre de usuario.'
  else if (/\s/.test(usuario)) errores.nombreUsuario = 'El nombre de usuario no puede tener espacios.'
  if (Object.keys(errores).length > 0) throw new AccesoInvalido(errores)
  return { ...acceso, nombreUsuario: usuario }
}

export function validarNuevaClave(clave: string, confirmacion: string): string {
  const errores = validarClave(clave, confirmacion)
  if (Object.keys(errores).length > 0) throw new AccesoInvalido(errores)
  return clave
}
