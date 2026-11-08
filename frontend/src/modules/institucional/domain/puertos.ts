import type { Enlace, MensajeContactoRecibido, NuevoMensaje, PoliticaDeDatos } from './contacto'

export interface RepositorioInstitucional {
  /** Formulario de contacto general (RF-03): no requiere sesión. */
  enviarMensaje(nuevo: NuevoMensaje): Promise<void>
  /** Política de tratamiento de datos personales (Ley 1581): pública. */
  politicaDeDatos(): Promise<PoliticaDeDatos>
  /** Enlaces activos visibles para la sesión actual, en el orden definido por la institución. */
  listarEnlaces(): Promise<Enlace[]>
  /** Listado de mensajes de contacto para el administrador general (RF-03). */
  listarMensajesContacto(soloNoLeidos?: boolean): Promise<MensajeContactoRecibido[]>
  /** Marca un mensaje de contacto como leído por el administrador. */
  marcarMensajeContactoLeido(id: number): Promise<void>
}
