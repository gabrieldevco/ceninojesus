export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface PeticionHttp {
  metodo: MetodoHttp
  /** Ruta relativa a la base de la API, p. ej. `/auth/perfil/` */
  ruta: string
  cuerpo?: unknown
  /** Si es `true` (por defecto) se envía el token y se renueva ante un 401. */
  autenticada?: boolean
}

/** Puerto del cliente HTTP: los repositorios dependen de esta interfaz, no de `fetch`. */
export interface HttpClient {
  /** Devuelve el cuerpo JSON (`undefined` si la respuesta no tiene cuerpo). Lanza ErrorApi, NoAutorizado o ErrorDeRed. */
  enviar<T = unknown>(peticion: PeticionHttp): Promise<T>
}

/** Quien conoce el token de acceso y sabe renovarlo. */
export interface ProveedorDeToken {
  tokenDeAcceso(): string | null
  /** Pide un token nuevo; devuelve `null` si la sesión ya no se puede renovar. */
  renovar(): Promise<string | null>
}
