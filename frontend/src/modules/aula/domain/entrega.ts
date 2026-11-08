import { esEnlaceSeguro, validarArchivo, type Actividad } from './contenido'

/** Trabajo que el estudiante entrega para una actividad; el docente lo califica y comenta. */
export interface Entrega {
  id: number
  actividadId: number
  estudianteId: number
  estudianteNombre: string
  texto: string
  url: string
  tieneArchivo: boolean
  archivoNombre: string
  /** Fecha y hora ISO completas */
  fechaEntrega: string
  /** Llegó después de la fecha límite de la actividad */
  tarde: boolean
  /** De 0.0 a 5.0; `null` mientras no esté calificada */
  calificacion: number | null
  comentarioDocente: string
  fechaCalificacion: string | null
}

export interface NuevaEntrega {
  grupoId: number
  actividadId: number
  texto: string
  url: string
  archivo: File | null
}

export interface Calificacion {
  grupoId: number
  actividadId: number
  entregaId: number
  calificacion: number | null
  comentario: string
}

export type EstadoTarea = 'asignada' | 'vencida' | 'entregada' | 'tarde' | 'calificada'

export const ETIQUETA_ESTADO: Record<EstadoTarea, string> = {
  asignada: 'Asignada',
  vencida: 'Sin entregar · vencida',
  entregada: 'Entregada',
  tarde: 'Entregada tarde',
  calificada: 'Calificada',
}

/** Clase del badge para cada estado (colores del portal). */
export const CLASE_ESTADO: Record<EstadoTarea, string> = {
  asignada: 'pendiente',
  vencida: 'rechazada',
  entregada: 'aprobada',
  tarde: 'coral',
  calificada: 'aprobada',
}

/** Hoy en formato AAAA-MM-DD según el reloj local. */
export function hoyIso(ahora: Date = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`
}

/** Estado de una tarea para el estudiante, como en un aula virtual. La fecha de entrega vence al final del día. */
export function estadoDeTarea(actividad: Pick<Actividad, 'fechaEntrega'>, entrega: Entrega | undefined, hoy = hoyIso()): EstadoTarea {
  if (entrega?.calificacion !== null && entrega?.calificacion !== undefined) return 'calificada'
  if (entrega) return entrega.tarde ? 'tarde' : 'entregada'
  if (actividad.fechaEntrega && hoy > actividad.fechaEntrega) return 'vencida'
  return 'asignada'
}

export type ErroresDeEntrega = Partial<Record<'texto' | 'url' | 'archivo' | 'recurso', string>>

export class EntregaInvalida extends Error {
  constructor(readonly campos: ErroresDeEntrega) {
    super(Object.values(campos)[0] ?? 'La entrega no es válida')
    this.name = 'EntregaInvalida'
  }
}

/** Mismas reglas del backend: texto, archivo o enlace; enlaces solo http(s). */
export function validarNuevaEntrega(datos: NuevaEntrega, yaTieneArchivo = false): NuevaEntrega {
  const campos: ErroresDeEntrega = {}
  const texto = datos.texto.trim()
  const url = datos.url.trim()
  if (texto.length > 5000) campos.texto = 'El texto no puede pasar de 5000 caracteres.'
  if (url && !esEnlaceSeguro(url)) campos.url = 'El enlace debe empezar por http:// o https://.'
  if (datos.archivo) {
    const error = validarArchivo(datos.archivo)
    if (error) campos.archivo = error
  }
  if (!texto && !url && !datos.archivo && !yaTieneArchivo) campos.recurso = 'Escribe una respuesta, adjunta un archivo o pega un enlace.'
  if (Object.keys(campos).length > 0) throw new EntregaInvalida(campos)
  return { ...datos, texto, url }
}

export class CalificacionInvalida extends Error {
  constructor() {
    super('La calificación debe estar entre 0.0 y 5.0, con máximo un decimal.')
    this.name = 'CalificacionInvalida'
  }
}

/** Convierte lo que escribe el docente ("4,5", "4.5", "") en una nota válida o `null`. */
export function leerCalificacion(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (!limpio) return null
  if (!/^\d(\.\d)?$/.test(limpio)) throw new CalificacionInvalida()
  const nota = Number(limpio)
  if (nota < 0 || nota > 5) throw new CalificacionInvalida()
  return nota
}

/** Resumen de una actividad para el docente: cuántos entregaron y cuántos faltan por calificar. */
export function resumenEntregas(entregas: Entrega[]): { total: number; porCalificar: number; promedio: number | null } {
  const calificadas = entregas.filter((e) => e.calificacion !== null)
  const suma = calificadas.reduce((s, e) => s + (e.calificacion ?? 0), 0)
  return {
    total: entregas.length,
    porCalificar: entregas.length - calificadas.length,
    promedio: calificadas.length > 0 ? Math.round((suma / calificadas.length) * 10) / 10 : null,
  }
}
