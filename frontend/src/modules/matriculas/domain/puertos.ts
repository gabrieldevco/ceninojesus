import type { EstadoSolicitud, NuevaSolicitud, SolicitudMatricula } from './solicitud'

export interface RepositorioSolicitudes {
  /** Solo las que el usuario puede ver: las de su familia, o las de los grupos que administra. */
  listar(): Promise<SolicitudMatricula[]>
  crear(nueva: NuevaSolicitud): Promise<SolicitudMatricula>
  resolver(id: number, estado: Exclude<EstadoSolicitud, 'pendiente'>, motivo?: string): Promise<SolicitudMatricula>
}
