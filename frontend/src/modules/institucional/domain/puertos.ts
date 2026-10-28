import type { NuevoMensaje, PoliticaDeDatos } from './contacto'

export interface RepositorioInstitucional {
  /** Formulario de contacto general (RF-03): no requiere sesión. */
  enviarMensaje(nuevo: NuevoMensaje): Promise<void>
  /** Política de tratamiento de datos personales (Ley 1581): pública. */
  politicaDeDatos(): Promise<PoliticaDeDatos>
}
