/** RF-01: contenido de la página de inicio, que administra la institución. */

export type SeccionLanding =
  | 'dato_destacado'
  | 'valor'
  | 'oferta'
  | 'directivo'
  | 'galeria'
  | 'imagen_portada'
  | 'imagen_quienes'
  | 'imagen_enfoque'

export const SECCIONES_DE_LISTA = ['dato_destacado', 'valor', 'oferta', 'directivo', 'galeria'] as const
export type SeccionDeLista = (typeof SECCIONES_DE_LISTA)[number]

export const SECCIONES_DE_IMAGEN = ['imagen_portada', 'imagen_quienes', 'imagen_enfoque'] as const
export type SeccionDeImagen = (typeof SECCIONES_DE_IMAGEN)[number]

export const ICONOS_DE_OFERTA = ['arte', 'deporte', 'musica', 'lit', 'ingles', 'ciencia'] as const
export type IconoDeOferta = (typeof ICONOS_DE_OFERTA)[number]

export interface InformacionLanding {
  nombre: string
  historia: string
  mision: string
  vision: string
  direccion: string
  ciudad: string
  telefonos: string
  correo: string
  horarioAtencion: string
  urlMapa: string
  urlFacebook: string
  politicaTratamientoDatos: string
  portadaEtiqueta: string
  portadaTitulo: string
  portadaDestacado: string
  portadaTexto: string
  quienesPrincipal: string
  quienesSecundario: string
  enfoqueTitulo: string
  enfoqueTexto: string
  /** Separados por comas */
  enfoquePasos: string
  enfoqueNota: string
  /** Mientras sea `true`, el inicio avisa que historia, misión y visión aún no son las oficiales */
  horizontePendienteValidacion: boolean
  contactoTitulo: string
  contactoTexto: string
  pieDescripcion: string
}

export interface ElementoLanding {
  id: number
  seccion: SeccionLanding
  titulo: string
  texto: string
  detalle: string
  icono: string
  /** Ruta lista para usar en `<img src>`: la imagen subida o la incluida con el sitio */
  imagen: string
  tieneImagenSubida: boolean
  orden: number
  activo: boolean
}

export interface ContenidoLanding {
  informacion: InformacionLanding
  elementos: ElementoLanding[]
}

export interface NuevoElemento {
  seccion: SeccionDeLista
  titulo: string
  texto: string
  detalle: string
  icono: string
  orden: number
  activo: boolean
}

export type CambiosDeElemento = Partial<Omit<NuevoElemento, 'seccion'>>

export const ETIQUETA_DE_SECCION: Record<SeccionDeLista, string> = {
  dato_destacado: 'Datos destacados',
  valor: 'Valores',
  oferta: 'Lo que ofrecemos',
  directivo: 'Cuerpo directivo',
  galeria: 'Galería de vida escolar',
}

export const ETIQUETA_DE_IMAGEN: Record<SeccionDeImagen, string> = {
  imagen_portada: 'Foto de la portada',
  imagen_quienes: 'Foto de "¿Quiénes somos?"',
  imagen_enfoque: 'Foto del enfoque constructivista',
}

export const ETIQUETA_DE_ICONO: Record<IconoDeOferta, string> = {
  arte: 'Arte y danza',
  deporte: 'Deporte',
  musica: 'Música',
  lit: 'Literatura',
  ingles: 'Inglés',
  ciencia: 'Ciencia',
}

/** Qué significan los campos de cada sección (para rotular el formulario de edición). */
export const CAMPOS_DE_SECCION: Record<
  SeccionDeLista,
  { titulo: string; texto: string; detalle?: string; icono?: 'emoji' | 'oferta' }
> = {
  dato_destacado: { titulo: 'Cifra o dato', texto: 'Descripción' },
  valor: { titulo: 'Valor', texto: 'Descripción', icono: 'emoji' },
  oferta: { titulo: 'Nombre', texto: 'Descripción', icono: 'oferta' },
  directivo: { titulo: 'Nombre', texto: 'Cargo', detalle: 'Correo' },
  galeria: { titulo: 'Pie de foto', texto: 'Descripción de la imagen (para lectores de pantalla)' },
}

export class ElementoInvalido extends Error {
  constructor(
    readonly campo: 'titulo' | 'texto' | 'orden',
    mensaje: string,
  ) {
    super(mensaje)
    this.name = 'ElementoInvalido'
  }
}

/** Reglas de cada sección: todas piden un texto principal; la galería además describe la imagen. */
export function validarElemento<T extends { titulo?: string; texto?: string; orden?: number }>(seccion: SeccionDeLista, datos: T): T {
  const campos = CAMPOS_DE_SECCION[seccion]
  if (datos.titulo !== undefined && !datos.titulo.trim()) throw new ElementoInvalido('titulo', `Escribe: ${campos.titulo.toLowerCase()}.`)
  if (seccion === 'galeria' && datos.texto !== undefined && !datos.texto.trim()) {
    throw new ElementoInvalido('texto', 'Describe la imagen: es necesario para quienes usan lectores de pantalla.')
  }
  if (datos.orden !== undefined && (!Number.isInteger(datos.orden) || datos.orden < 0)) {
    throw new ElementoInvalido('orden', 'El orden es un número entero desde 0.')
  }
  return {
    ...datos,
    ...(datos.titulo !== undefined && { titulo: datos.titulo.trim() }),
    ...(datos.texto !== undefined && { texto: datos.texto.trim() }),
  }
}

export const TIPOS_DE_IMAGEN = ['image/jpeg', 'image/png'] as const
export const TAMANO_MAXIMO_DE_IMAGEN_MB = 5

export class ImagenInvalida extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ImagenInvalida'
  }
}

/** Avisa antes de subir; el servidor vuelve a validar el tipo real del archivo. */
export function validarImagen(archivo: { type: string; size: number }): void {
  if (!(TIPOS_DE_IMAGEN as readonly string[]).includes(archivo.type)) throw new ImagenInvalida('La imagen debe ser JPG o PNG.')
  if (archivo.size > TAMANO_MAXIMO_DE_IMAGEN_MB * 1024 * 1024) {
    throw new ImagenInvalida(`La imagen supera el máximo de ${TAMANO_MAXIMO_DE_IMAGEN_MB} MB.`)
  }
}

/** Elementos de una sección, en el orden que definió la institución. */
export function deSeccion(contenido: Pick<ContenidoLanding, 'elementos'>, seccion: SeccionLanding): ElementoLanding[] {
  return contenido.elementos.filter((e) => e.seccion === seccion).sort((a, b) => a.orden - b.orden || a.id - b.id)
}

/** Imagen de una sección de imagen única; `porDefecto` mientras la institución no suba una. */
export function imagenUnica(contenido: ContenidoLanding, seccion: SeccionDeImagen, porDefecto: { src: string; alt: string }) {
  const elemento = contenido.elementos.find((e) => e.seccion === seccion && e.activo)
  if (!elemento || !elemento.imagen) return porDefecto
  return { src: elemento.imagen, alt: elemento.texto || porDefecto.alt }
}

export const pasosDelEnfoque = (informacion: Pick<InformacionLanding, 'enfoquePasos'>): string[] =>
  informacion.enfoquePasos
    .split(',')
    .map((paso) => paso.trim())
    .filter(Boolean)

/** Primer teléfono en formato `tel:`; vacío si no hay dígitos suficientes. Los números de 10 dígitos son celulares colombianos. */
export function enlaceDeLlamada(telefonos: string): string {
  const primero = telefonos.split(/[·,;/]/)[0] ?? ''
  const digitos = primero.replace(/\D/g, '')
  if (digitos.length < 7) return ''
  return digitos.length === 10 ? `tel:+57${digitos}` : `tel:${digitos}`
}

/** Dirección y ciudad en una línea, sin repetir separadores si falta alguna. */
export const direccionCompleta = (i: Pick<InformacionLanding, 'direccion' | 'ciudad'>): string =>
  [i.direccion, i.ciudad].filter((parte) => parte.trim()).join(', ')
