export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface PeticionHttp {
  metodo: MetodoHttp
  /** Ruta relativa a la base de la API, p. ej. `/auth/perfil/` */
  ruta: string
  cuerpo?: unknown
  /** Si es `true` (por defecto) se envía el token y se renueva ante un 401. */
  autenticada?: boolean
}

export interface ArchivoDescargado {
  contenido: Blob
  /** Nombre sugerido por el servidor (Content-Disposition); vacío si no lo envió */
  nombre: string
}

/** Puerto del cliente HTTP: los repositorios dependen de esta interfaz, no de `fetch`. */
export interface HttpClient {
  /** Devuelve el cuerpo JSON (`undefined` si la respuesta no tiene cuerpo). Lanza ErrorApi, NoAutorizado o ErrorDeRed. */
  enviar<T = unknown>(peticion: PeticionHttp): Promise<T>
  /** Descarga un archivo protegido: como `enviar`, pero devuelve el binario en lugar de JSON. */
  descargar(peticion: Pick<PeticionHttp, 'ruta'>): Promise<ArchivoDescargado>
}

/** Quien conoce el token de acceso y sabe renovarlo. */
export interface ProveedorDeToken {
  tokenDeAcceso(): string | null
  /** Pide un token nuevo; devuelve `null` si la sesión ya no se puede renovar. */
  renovar(): Promise<string | null>
}
