/** Enlaces del portal (aula virtual, biblioteca...) que la institución administra. */
export type TipoDeEnlace = 'sistema_administrativo' | 'biblioteca' | 'otro'

export const TIPOS_DE_ENLACE: readonly TipoDeEnlace[] = ['sistema_administrativo', 'biblioteca', 'otro']

export const ETIQUETA_DE_TIPO_DE_ENLACE: Record<TipoDeEnlace, string> = {
  sistema_administrativo: 'Sistema administrativo',
  biblioteca: 'Biblioteca',
  otro: 'Otro',
}

export interface EnlaceEditable {
  id: number
  nombre: string
  url: string
  tipo: TipoDeEnlace
  descripcion: string
  /** Solo lo ven quienes iniciaron sesión */
  requiereAutenticacion: boolean
  orden: number
  activo: boolean
}

export type NuevoEnlace = Omit<EnlaceEditable, 'id'>

export class EnlaceInvalido extends Error {
  constructor(
    readonly campo: 'nombre' | 'url',
    mensaje: string,
  ) {
    super(mensaje)
    this.name = 'EnlaceInvalido'
  }
}

/** Solo se admiten direcciones http o https: nunca `javascript:` ni similares. */
export function esUrlWeb(valor: string): boolean {
  try {
    const url = new URL(valor.trim())
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function validarEnlace<T extends Partial<NuevoEnlace>>(datos: T): T {
  if (datos.nombre !== undefined && !datos.nombre.trim()) throw new EnlaceInvalido('nombre', 'Escribe el nombre del enlace.')
  if (datos.url !== undefined && !esUrlWeb(datos.url)) {
    throw new EnlaceInvalido('url', 'Escribe una dirección completa que empiece por https://')
  }
  return {
    ...datos,
    ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
    ...(datos.url !== undefined && { url: datos.url.trim() }),
  }
}

/** Direcciones de redes y mapa de la información institucional, vacías o válidas. */
export function validarDireccionesWeb(cambios: { urlMapa?: string; urlFacebook?: string }): void {
  for (const [campo, etiqueta] of [
    ['urlMapa', 'del mapa'],
    ['urlFacebook', 'de Facebook'],
  ] as const) {
    const valor = cambios[campo]
    if (valor && !esUrlWeb(valor)) throw new EnlaceInvalido('url', `La dirección ${etiqueta} debe empezar por https://`)
  }
}
