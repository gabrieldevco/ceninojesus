import type { EstadoSolicitud, NuevaSolicitud, SolicitudMatricula } from './solicitud'

export interface RepositorioSolicitudes {
  listar(): Promise<SolicitudMatricula[]>
  crear(nueva: NuevaSolicitud): Promise<SolicitudMatricula>
  resolver(id: number, estado: Exclude<EstadoSolicitud, 'pendiente'>, motivo?: string): Promise<SolicitudMatricula>
}

/** Opciones que se ofrecen al llenar el formulario de matrícula. */
export interface CatalogoMatricula {
  estudiantes(): Promise<string[]>
}
