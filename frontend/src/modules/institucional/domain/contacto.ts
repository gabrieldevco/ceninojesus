export interface NuevoMensaje {
  nombre: string
  correo: string
  telefono: string
  asunto: string
  mensaje: string
  /** La persona autoriza el tratamiento de sus datos para que el colegio le responda (Ley 1581 de 2012). */
  autorizaTratamientoDatos: boolean
}

export type ErroresDeMensaje = Partial<Record<keyof NuevoMensaje, string>>

export class MensajeInvalido extends Error {
  constructor(readonly campos: ErroresDeMensaje) {
    super(Object.values(campos)[0] ?? 'El mensaje no es válido')
    this.name = 'MensajeInvalido'
  }
}

export interface PoliticaDeDatos {
  /** Texto de la política de tratamiento de datos personales */
  texto: string
  /** Correo al que se dirigen las solicitudes sobre los datos */
  correo: string
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Reglas que el backend también exige; así se avisa antes de enviar. */
export function validarNuevoMensaje(datos: NuevoMensaje): NuevoMensaje {
  const campos: ErroresDeMensaje = {}
  if (!datos.nombre.trim()) campos.nombre = 'Escribe tu nombre.'
  if (!CORREO.test(datos.correo.trim())) campos.correo = 'Escribe un correo válido para poder responderte.'
  if (!datos.asunto.trim()) campos.asunto = 'Escribe el asunto.'
  if (!datos.mensaje.trim()) campos.mensaje = 'Escribe tu mensaje.'
  if (!datos.autorizaTratamientoDatos) {
    campos.autorizaTratamientoDatos = 'Debes autorizar el tratamiento de tus datos para que podamos responderte.'
  }
  if (Object.keys(campos).length > 0) throw new MensajeInvalido(campos)
  return {
    ...datos,
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim(),
    telefono: datos.telefono.trim(),
    asunto: datos.asunto.trim(),
    mensaje: datos.mensaje.trim(),
  }
}
