import type { Usuario } from './usuario'

export interface RepositorioAutenticacion {
  /** Devuelve el usuario si las credenciales son válidas; `null` si no. */
  iniciarSesion(correo: string, clave: string): Promise<Usuario | null>
  /** Recupera la sesión guardada, si existe. */
  obtenerSesion(): Promise<Usuario | null>
  cerrarSesion(): Promise<void>
}
