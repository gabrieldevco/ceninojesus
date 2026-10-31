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

// --- Gestión de interesados por el administrador (RF-19) ---

export type EstadoInteresado = 'nuevo' | 'en_seguimiento' | 'matriculado' | 'descartado'

export const ESTADOS_DE_INTERESADO: readonly EstadoInteresado[] = ['nuevo', 'en_seguimiento', 'matriculado', 'descartado']

export const ETIQUETA_DE_ESTADO: Record<EstadoInteresado, string> = {
  nuevo: 'Nuevo',
  en_seguimiento: 'En seguimiento',
  matriculado: 'Matriculado',
  descartado: 'Descartado',
}

/** Estados a los que se puede pasar desde cada uno: los mismos que exige el backend. */
const TRANSICIONES: Record<EstadoInteresado, readonly EstadoInteresado[]> = {
  nuevo: ['en_seguimiento', 'matriculado', 'descartado'],
  en_seguimiento: ['matriculado', 'descartado'],
  matriculado: [],
  descartado: [],
}

export function transicionesPermitidas(actual: EstadoInteresado): readonly EstadoInteresado[] {
  return TRANSICIONES[actual]
}

export interface Interesado {
  id: number
  nombreCompleto: string
  correo: string
  telefono: string
  mensaje: string
  nombreAspirante: string
  gradoInteres: string
  estado: EstadoInteresado
  /** Fecha ISO (AAAA-MM-DD) */
  fechaRegistro: string
  /** Fecha ISO (AAAA-MM-DD) o `null` si aún no se le ha contactado */
  fechaUltimoContacto: string | null
}

export interface Seguimiento {
  id: number
  nota: string
  /** Fecha ISO (AAAA-MM-DD) */
  fecha: string
}

export class NotaRequerida extends Error {
  constructor() {
    super('Escribe qué se habló con el interesado.')
    this.name = 'NotaRequerida'
  }
}

export function validarNota(nota: string): string {
  const limpia = nota.trim()
  if (!limpia) throw new NotaRequerida()
  return limpia
}

export function contarPorEstado(interesados: readonly Interesado[], estado: EstadoInteresado): number {
  return interesados.filter((i) => i.estado === estado).length
}
