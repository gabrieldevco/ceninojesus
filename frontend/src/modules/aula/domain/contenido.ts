export type TipoMaterial = 'documento' | 'video' | 'enlace'
export type TipoContenido = 'materiales' | 'actividades'

interface ContenidoBase {
  id: number
  grupoId: number
  titulo: string
  descripcion: string
  /** Enlace externo (puede estar vacío) */
  url: string
  /** Si tiene un archivo adjunto que se descarga con la sesión del usuario */
  tieneArchivo: boolean
  /** Fecha ISO (AAAA-MM-DD) de publicación */
  fechaPublicacion: string
}

/** RF-12: documentos, videos o enlaces de apoyo. */
export interface Material extends ContenidoBase {
  tipo: TipoMaterial
}

/** RF-13: actividades dirigidas a los estudiantes inscritos. */
export interface Actividad extends ContenidoBase {
  /** Fecha ISO (AAAA-MM-DD) o `null` si no tiene fecha de entrega */
  fechaEntrega: string | null
}

export type Contenido = Material | Actividad

export interface ArchivoDeContenido {
  contenido: Blob
  nombre: string
}

/** Cómo se ofrece un material al estudiante según lo que tenga cargado. */
export type AccionDeContenido = 'descargar' | 'abrir-enlace' | 'ninguna'

export function accionDeContenido(contenido: Contenido): AccionDeContenido {
  if (contenido.tieneArchivo) return 'descargar'
  if (contenido.url) return 'abrir-enlace'
  return 'ninguna'
}

/** Solo se abren enlaces http(s): una URL `javascript:` guardada por error nunca debe ejecutarse. */
export function esEnlaceSeguro(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}
