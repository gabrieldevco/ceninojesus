export const GRADOS = ['Preescolar', 'Primaria', 'Secundaria', 'Media'] as const
export type GradoDeInteres = (typeof GRADOS)[number]

export interface NuevoInteresado {
  nombreCompleto: string
  correo: string
  telefono: string
  nombreAspirante: string
  gradoInteres: GradoDeInteres
  mensaje: string
  /** El interesado autoriza el tratamiento de sus datos para el seguimiento de admisiones (Ley 1581 de 2012). */
  autorizaTratamientoDatos: boolean
}

export type ErroresDeInteresado = Partial<Record<keyof NuevoInteresado, string>>

export class InteresadoInvalido extends Error {
  constructor(readonly campos: ErroresDeInteresado) {
    super(Object.values(campos)[0] ?? 'Los datos no son válidos')
    this.name = 'InteresadoInvalido'
  }
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MINIMO_DIGITOS_TELEFONO = 7

/** Reglas que el backend también exige; así se avisa antes de enviar. */
export function validarNuevoInteresado(datos: NuevoInteresado): NuevoInteresado {
  const campos: ErroresDeInteresado = {}
  if (!datos.nombreCompleto.trim()) campos.nombreCompleto = 'Escribe tu nombre completo.'
  if (!CORREO.test(datos.correo.trim())) campos.correo = 'Escribe un correo válido, como nombre@ejemplo.com.'
  if (datos.telefono.replace(/\D/g, '').length < MINIMO_DIGITOS_TELEFONO) {
    campos.telefono = `Escribe un teléfono de al menos ${MINIMO_DIGITOS_TELEFONO} dígitos.`
  }
  if (!datos.autorizaTratamientoDatos) {
    campos.autorizaTratamientoDatos = 'Debes autorizar el tratamiento de tus datos para que podamos contactarte.'
  }
  if (Object.keys(campos).length > 0) throw new InteresadoInvalido(campos)
  return {
    ...datos,
    nombreCompleto: datos.nombreCompleto.trim(),
    correo: datos.correo.trim(),
    telefono: datos.telefono.trim(),
    nombreAspirante: datos.nombreAspirante.trim(),
    mensaje: datos.mensaje.trim(),
  }
}
