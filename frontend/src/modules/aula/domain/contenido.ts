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
  /** Los borradores solo los ve quien administra el grupo */
  publicado: boolean
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

// --- Publicación (RF-12 y RF-13): reglas que el backend también exige, para avisar antes de enviar ---

export const TAMANO_MAXIMO_MB = 20
export const EXTENSIONES_PERMITIDAS = [
  '.pdf', '.png', '.jpg', '.jpeg', '.docx', '.pptx', '.xlsx', '.zip', '.doc', '.ppt', '.xls', '.mp4', '.txt',
] as const

export interface NuevoMaterial {
  grupoId: number
  titulo: string
  descripcion: string
  tipo: TipoMaterial
  url: string
  archivo: File | null
  publicado: boolean
}

export interface NuevaActividad {
  grupoId: number
  titulo: string
  descripcion: string
  url: string
  archivo: File | null
  /** Fecha ISO (AAAA-MM-DD) o `null` */
  fechaEntrega: string | null
  publicado: boolean
}

export type ErroresDePublicacion = Partial<Record<'titulo' | 'url' | 'archivo' | 'recurso', string>>

export class PublicacionInvalida extends Error {
  constructor(readonly campos: ErroresDePublicacion) {
    super(Object.values(campos)[0] ?? 'La publicación no es válida')
    this.name = 'PublicacionInvalida'
  }
}

export function validarArchivo(archivo: Pick<File, 'name' | 'size'>): string | null {
  const punto = archivo.name.lastIndexOf('.')
  const extension = punto === -1 ? '' : archivo.name.slice(punto).toLowerCase()
  if (!(EXTENSIONES_PERMITIDAS as readonly string[]).includes(extension)) {
    return `Tipo de archivo no permitido. Usa: ${EXTENSIONES_PERMITIDAS.join(', ')}.`
  }
  if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) return `El archivo supera el máximo de ${TAMANO_MAXIMO_MB} MB.`
  return null
}

function validarComun(
  datos: { titulo: string; url: string; archivo: File | null },
  campos: ErroresDePublicacion,
): void {
  if (!datos.titulo.trim()) campos.titulo = 'Escribe un título.'
  else if (datos.titulo.trim().length > 200) campos.titulo = 'El título no puede pasar de 200 caracteres.'
  if (datos.url.trim() && !esEnlaceSeguro(datos.url.trim())) campos.url = 'El enlace debe empezar por http:// o https://.'
  if (datos.archivo) {
    const error = validarArchivo(datos.archivo)
    if (error) campos.archivo = error
  }
}

export function validarNuevoMaterial(datos: NuevoMaterial): NuevoMaterial {
  const campos: ErroresDePublicacion = {}
  validarComun(datos, campos)
  if (datos.tipo === 'enlace' && !datos.url.trim()) campos.url = 'Un material de tipo enlace necesita una URL.'
  if (!datos.archivo && !datos.url.trim()) campos.recurso = 'El material debe tener un archivo o un enlace.'
  if (Object.keys(campos).length > 0) throw new PublicacionInvalida(campos)
  return { ...datos, titulo: datos.titulo.trim(), descripcion: datos.descripcion.trim(), url: datos.url.trim() }
}

export function validarNuevaActividad(datos: NuevaActividad): NuevaActividad {
  const campos: ErroresDePublicacion = {}
  validarComun(datos, campos)
  if (Object.keys(campos).length > 0) throw new PublicacionInvalida(campos)
  return { ...datos, titulo: datos.titulo.trim(), descripcion: datos.descripcion.trim(), url: datos.url.trim() }
}
