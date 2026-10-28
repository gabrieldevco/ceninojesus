export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'

export interface SolicitudMatricula {
  id: number
  estudianteId: number
  estudiante: string
  grupoId: number
  grupo: string
  comentario: string
  /** Fecha ISO (AAAA-MM-DD) en que se hizo la solicitud */
  fecha: string
  estado: EstadoSolicitud
  /** Motivo del rechazo; solo existe si la solicitud fue rechazada */
  motivo?: string
}

export interface NuevaSolicitud {
  estudianteId: number
  grupoId: number
  comentario?: string
}

/** Estudiante vinculado al acudiente, para elegirlo en el formulario. */
export interface EstudianteVinculado {
  id: number
  nombre: string
}

export const MOTIVO_MINIMO_CARACTERES = 5

export class SolicitudDuplicada extends Error {
  constructor(readonly existente: SolicitudMatricula) {
    super(`Ya existe una solicitud ${existente.estado} para ${existente.estudiante} en ${existente.grupo}`)
    this.name = 'SolicitudDuplicada'
  }
}

export class MotivoRequerido extends Error {
  constructor() {
    super('El rechazo requiere un motivo claro')
    this.name = 'MotivoRequerido'
  }
}

/** Una solicitud sigue "viva" mientras no haya sido rechazada: no se puede repetir. */
export function buscarDuplicada(
  existentes: readonly SolicitudMatricula[],
  nueva: NuevaSolicitud,
): SolicitudMatricula | undefined {
  return existentes.find(
    (s) => s.estudianteId === nueva.estudianteId && s.grupoId === nueva.grupoId && s.estado !== 'rechazada',
  )
}

export function validarMotivoRechazo(motivo: string): string {
  const limpio = motivo.trim()
  if (limpio.length < MOTIVO_MINIMO_CARACTERES) throw new MotivoRequerido()
  return limpio
}

export function contarPorEstado(solicitudes: readonly SolicitudMatricula[], estado: EstadoSolicitud): number {
  return solicitudes.filter((s) => s.estado === estado).length
}
