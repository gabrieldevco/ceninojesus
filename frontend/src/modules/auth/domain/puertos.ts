import type { Usuario } from './usuario'

/** Se superó el máximo de intentos fallidos: la cuenta queda bloqueada un rato. */
export class DemasiadosIntentos extends Error {
  constructor() {
    super('Demasiados intentos fallidos. Intente de nuevo en unos minutos.')
    this.name = 'DemasiadosIntentos'
  }
}

export interface RepositorioAutenticacion {
  /** Devuelve el usuario si las credenciales son válidas; `null` si no. Lanza DemasiadosIntentos si hay bloqueo. */
  iniciarSesion(identificador: string, clave: string): Promise<Usuario | null>
  /** Recupera la sesión guardada, si existe y sigue siendo válida. */
  obtenerSesion(): Promise<Usuario | null>
  cerrarSesion(): Promise<void>
  /** Pide el enlace de recuperación. Responde igual exista o no la cuenta. */
  solicitarRecuperacion(identificador: string): Promise<void>
}
