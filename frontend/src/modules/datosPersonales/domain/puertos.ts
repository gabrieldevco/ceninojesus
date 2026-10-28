import type { NuevaSolicitud, SolicitudDeDatos } from './solicitud'

export interface RepositorioSolicitudesDeDatos {
  /** Cualquier titular radica su solicitud, con o sin cuenta: no requiere sesión. */
  radicar(nueva: NuevaSolicitud): Promise<void>
  /** Solo el administrador general. */
  listar(): Promise<SolicitudDeDatos[]>
  /** La solicitud pasa a "en trámite". */
  tramitar(id: number): Promise<SolicitudDeDatos>
  /** Cierra la solicitud con la respuesta al titular (se le envía por correo). */
  responder(id: number, respuesta: string): Promise<SolicitudDeDatos>
}
