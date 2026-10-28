/** Ley 1581 de 2012: derechos del titular sobre sus datos personales. */
export type TipoDeSolicitud = 'consulta' | 'actualizacion' | 'rectificacion' | 'supresion' | 'revocatoria'
export type EstadoDeSolicitud = 'recibida' | 'en_tramite' | 'resuelta'

export const TIPOS_DE_SOLICITUD: readonly TipoDeSolicitud[] = ['consulta', 'actualizacion', 'rectificacion', 'supresion', 'revocatoria']
export const ESTADOS_DE_SOLICITUD: readonly EstadoDeSolicitud[] = ['recibida', 'en_tramite', 'resuelta']

export const ETIQUETA_DE_TIPO: Record<TipoDeSolicitud, string> = {
  consulta: 'Consulta de mis datos',
  actualizacion: 'Actualización',
  rectificacion: 'Rectificación',
  supresion: 'Supresión',
  revocatoria: 'Revocar la autorización',
}

export const ETIQUETA_DE_ESTADO: Record<EstadoDeSolicitud, string> = {
  recibida: 'Recibida',
  en_tramite: 'En trámite',
  resuelta: 'Resuelta',
}

export interface SolicitudDeDatos {
  id: number
  nombre: string
  correo: string
  documentoIdentidad: string
  tipo: TipoDeSolicitud
  descripcion: string
  estado: EstadoDeSolicitud
  respuesta: string
  /** AAAA-MM-DD */
  fechaSolicitud: string
  /** AAAA-MM-DD: plazo legal (10 días hábiles las consultas, 15 los reclamos) */
  fechaLimite: string
  fechaRespuesta: string | null
}

export interface NuevaSolicitud {
  nombre: string
  correo: string
  documentoIdentidad: string
  tipo: TipoDeSolicitud
  descripcion: string
}

export type ErroresDeSolicitud = Partial<Record<keyof NuevaSolicitud, string>>

export class SolicitudInvalida extends Error {
  constructor(readonly campos: ErroresDeSolicitud) {
    super(Object.values(campos)[0] ?? 'La solicitud no es válida')
    this.name = 'SolicitudInvalida'
  }
}

export class RespuestaRequerida extends Error {
  constructor() {
    super('Escribe la respuesta que recibirá el titular.')
    this.name = 'RespuestaRequerida'
  }
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validarNuevaSolicitud(datos: NuevaSolicitud): NuevaSolicitud {
  const campos: ErroresDeSolicitud = {}
  if (!datos.nombre.trim()) campos.nombre = 'Escribe tu nombre.'
  if (!CORREO.test(datos.correo.trim())) campos.correo = 'Escribe un correo válido: allí te responderemos.'
  if (!datos.descripcion.trim()) campos.descripcion = 'Cuéntanos qué necesitas.'
  if (Object.keys(campos).length > 0) throw new SolicitudInvalida(campos)
  return {
    ...datos,
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim(),
    documentoIdentidad: datos.documentoIdentidad.trim(),
    descripcion: datos.descripcion.trim(),
  }
}

export function validarRespuesta(respuesta: string): string {
  if (!respuesta.trim()) throw new RespuestaRequerida()
  return respuesta.trim()
}

/** Hoy en AAAA-MM-DD según la hora local. */
export const hoyIso = (ahora: Date = new Date()): string =>
  `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`

/** Una solicitud sin resolver cuyo plazo legal ya pasó. */
export const estaVencida = (s: Pick<SolicitudDeDatos, 'estado' | 'fechaLimite'>, hoy: string = hoyIso()): boolean =>
  s.estado !== 'resuelta' && s.fechaLimite < hoy

export const estaPendiente = (s: Pick<SolicitudDeDatos, 'estado'>): boolean => s.estado !== 'resuelta'

export const contarPorEstado = (solicitudes: readonly Pick<SolicitudDeDatos, 'estado'>[], estado: EstadoDeSolicitud): number =>
  solicitudes.filter((s) => s.estado === estado).length
