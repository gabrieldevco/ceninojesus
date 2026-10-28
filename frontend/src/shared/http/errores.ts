/** El servidor respondió con un estado de error. `detalle` es el mensaje de la API; `campos` los errores por campo. */
export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly detalle: string,
    readonly campos: Record<string, string[]> = {},
  ) {
    super(detalle)
    this.name = 'ErrorApi'
  }
}

/** La sesión no es válida (401) y no se pudo renovar. */
export class NoAutorizado extends ErrorApi {
  constructor(detalle = 'La sesión no es válida') {
    super(401, detalle)
    this.name = 'NoAutorizado'
  }
}

/** No hubo respuesta: sin conexión, servidor caído o petición cancelada. */
export class ErrorDeRed extends Error {
  constructor(causa?: unknown) {
    super('No se pudo conectar con el servidor', { cause: causa })
    this.name = 'ErrorDeRed'
  }
}

type CuerpoDeError = { detail?: unknown } & Record<string, unknown>

/** Convierte el cuerpo de error de DRF (`{detail}` o `{campo: [mensajes]}`) en un ErrorApi. */
export function errorDesdeRespuesta(estado: number, cuerpo: unknown): ErrorApi {
  if (typeof cuerpo === 'object' && cuerpo !== null) {
    const datos = cuerpo as CuerpoDeError
    if (typeof datos.detail === 'string') return new ErrorApi(estado, datos.detail)
    const campos: Record<string, string[]> = {}
    for (const [campo, valor] of Object.entries(datos)) {
      if (Array.isArray(valor)) campos[campo] = valor.map(String)
    }
    const primero = Object.values(campos)[0]?.[0]
    return new ErrorApi(estado, primero ?? `Error ${estado}`, campos)
  }
  return new ErrorApi(estado, `Error ${estado}`)
}
