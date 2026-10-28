import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type {
  CambiosDeElemento,
  ContenidoLanding,
  ElementoLanding,
  InformacionLanding,
  NuevoElemento,
  SeccionDeImagen,
} from '../domain/landing'
import type { RepositorioSitio } from '../domain/puertosSitio'
import type { EnlaceEditable, NuevoEnlace } from '../domain/sitio'

/** Texto que la API puede devolver nulo: la entidad siempre trae una cadena. */
const texto = z
  .string()
  .nullish()
  .transform((v) => v ?? '')

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const InformacionDto = z.object({
  nombre: texto,
  historia: texto,
  mision: texto,
  vision: texto,
  direccion: texto,
  ciudad: texto,
  telefonos: texto,
  correo: texto,
  horario_atencion: texto,
  url_mapa: texto,
  url_facebook: texto,
  politica_tratamiento_datos: texto,
  portada_etiqueta: texto,
  portada_titulo: texto,
  portada_destacado: texto,
  portada_texto: texto,
  quienes_principal: texto,
  quienes_secundario: texto,
  enfoque_titulo: texto,
  enfoque_texto: texto,
  enfoque_pasos: texto,
  enfoque_nota: texto,
  horizonte_pendiente_validacion: z.boolean().default(true),
  contacto_titulo: texto,
  contacto_texto: texto,
  pie_descripcion: texto,
})

const SECCIONES = ['dato_destacado', 'valor', 'oferta', 'directivo', 'galeria', 'imagen_portada', 'imagen_quienes', 'imagen_enfoque'] as const

const ElementoDto = z.object({
  id: z.number(),
  seccion: z.enum(SECCIONES),
  titulo: texto,
  texto,
  detalle: texto,
  icono: texto,
  imagen: texto,
  tiene_imagen_subida: z.boolean().default(false),
  orden: z.number().default(0),
  activo: z.boolean().default(true),
})

const EnlaceDto = z.object({
  id: z.number(),
  nombre: z.string(),
  url: z.string(),
  tipo: z.enum(['sistema_administrativo', 'biblioteca', 'otro']),
  descripcion: texto,
  requiere_autenticacion: z.boolean().default(false),
  orden: z.number().default(0),
  activo: z.boolean().default(true),
})

/** Campo de la entidad -> campo de la API. */
const CAMPOS_DE_INFORMACION: ReadonlyArray<readonly [keyof InformacionLanding, keyof z.infer<typeof InformacionDto>]> = [
  ['nombre', 'nombre'],
  ['historia', 'historia'],
  ['mision', 'mision'],
  ['vision', 'vision'],
  ['direccion', 'direccion'],
  ['ciudad', 'ciudad'],
  ['telefonos', 'telefonos'],
  ['correo', 'correo'],
  ['horarioAtencion', 'horario_atencion'],
  ['urlMapa', 'url_mapa'],
  ['urlFacebook', 'url_facebook'],
  ['politicaTratamientoDatos', 'politica_tratamiento_datos'],
  ['portadaEtiqueta', 'portada_etiqueta'],
  ['portadaTitulo', 'portada_titulo'],
  ['portadaDestacado', 'portada_destacado'],
  ['portadaTexto', 'portada_texto'],
  ['quienesPrincipal', 'quienes_principal'],
  ['quienesSecundario', 'quienes_secundario'],
  ['enfoqueTitulo', 'enfoque_titulo'],
  ['enfoqueTexto', 'enfoque_texto'],
  ['enfoquePasos', 'enfoque_pasos'],
  ['enfoqueNota', 'enfoque_nota'],
  ['horizontePendienteValidacion', 'horizonte_pendiente_validacion'],
  ['contactoTitulo', 'contacto_titulo'],
  ['contactoTexto', 'contacto_texto'],
  ['pieDescripcion', 'pie_descripcion'],
]

function aInformacion(dto: z.infer<typeof InformacionDto>): InformacionLanding {
  const entidad: Record<string, unknown> = {}
  for (const [campo, campoApi] of CAMPOS_DE_INFORMACION) entidad[campo] = dto[campoApi]
  return entidad as unknown as InformacionLanding
}

/** Solo los campos presentes: un PATCH no debe borrar lo que no se editó. */
function cuerpoDeInformacion(cambios: Partial<InformacionLanding>): Record<string, unknown> {
  const cuerpo: Record<string, unknown> = {}
  for (const [campo, campoApi] of CAMPOS_DE_INFORMACION) {
    if (cambios[campo] !== undefined) cuerpo[campoApi] = cambios[campo]
  }
  return cuerpo
}

const aElemento = (dto: z.infer<typeof ElementoDto>): ElementoLanding => ({
  id: dto.id,
  seccion: dto.seccion,
  titulo: dto.titulo,
  texto: dto.texto,
  detalle: dto.detalle,
  icono: dto.icono,
  imagen: dto.imagen,
  tieneImagenSubida: dto.tiene_imagen_subida,
  orden: dto.orden,
  activo: dto.activo,
})

const aEnlace = (dto: z.infer<typeof EnlaceDto>): EnlaceEditable => ({
  id: dto.id,
  nombre: dto.nombre,
  url: dto.url,
  tipo: dto.tipo,
  descripcion: dto.descripcion,
  requiereAutenticacion: dto.requiere_autenticacion,
  orden: dto.orden,
  activo: dto.activo,
})

const cuerpoDeEnlace = (datos: Partial<NuevoEnlace>) => ({
  nombre: datos.nombre,
  url: datos.url,
  tipo: datos.tipo,
  descripcion: datos.descripcion,
  requiere_autenticacion: datos.requiereAutenticacion,
  orden: datos.orden,
  activo: datos.activo,
})

export class RepositorioSitioHttp implements RepositorioSitio {
  constructor(private readonly http: HttpClient) {}

  async obtenerContenido(): Promise<ContenidoLanding> {
    const [informacion, elementos] = await Promise.all([
      this.http.enviar({ metodo: 'GET', ruta: '/institucional/', autenticada: false }),
      this.http.enviar({ metodo: 'GET', ruta: '/institucional/elementos/', autenticada: false }),
    ])
    return {
      informacion: aInformacion(InformacionDto.parse(informacion)),
      elementos: z.array(ElementoDto).parse(elementos).map(aElemento),
    }
  }

  async actualizarInformacion(cambios: Partial<InformacionLanding>): Promise<InformacionLanding> {
    const datos = await this.http.enviar({ metodo: 'PATCH', ruta: '/institucional/', cuerpo: cuerpoDeInformacion(cambios) })
    return aInformacion(InformacionDto.parse(datos))
  }

  async listarElementos(): Promise<ElementoLanding[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/institucional/elementos/?todos=true' })
    return z.array(ElementoDto).parse(datos).map(aElemento)
  }

  async crearElemento(nuevo: NuevoElemento): Promise<ElementoLanding> {
    const datos = await this.http.enviar({ metodo: 'POST', ruta: '/institucional/elementos/', cuerpo: nuevo })
    return aElemento(ElementoDto.parse(datos))
  }

  async actualizarElemento(id: number, cambios: CambiosDeElemento): Promise<ElementoLanding> {
    const datos = await this.http.enviar({ metodo: 'PATCH', ruta: `/institucional/elementos/${id}/`, cuerpo: cambios })
    return aElemento(ElementoDto.parse(datos))
  }

  async eliminarElemento(id: number): Promise<void> {
    await this.http.enviar({ metodo: 'DELETE', ruta: `/institucional/elementos/${id}/` })
  }

  async subirImagen(id: number, archivo: File): Promise<ElementoLanding> {
    const formulario = new FormData()
    formulario.append('imagen', archivo)
    const datos = await this.http.enviar({ metodo: 'POST', ruta: `/institucional/elementos/${id}/imagen/`, cuerpo: formulario })
    return aElemento(ElementoDto.parse(datos))
  }

  async quitarImagen(id: number): Promise<ElementoLanding> {
    const datos = await this.http.enviar({ metodo: 'DELETE', ruta: `/institucional/elementos/${id}/imagen/` })
    return aElemento(ElementoDto.parse(datos))
  }

  async reemplazarImagenUnica(seccion: SeccionDeImagen, archivo: File): Promise<ElementoLanding> {
    const formulario = new FormData()
    formulario.append('imagen', archivo)
    const datos = await this.http.enviar({ metodo: 'PUT', ruta: `/institucional/imagenes/${seccion}/`, cuerpo: formulario })
    return aElemento(ElementoDto.parse(datos))
  }

  async listarEnlacesEditables(): Promise<EnlaceEditable[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/institucional/enlaces/?todos=true' })
    return z.array(EnlaceDto).parse(datos).map(aEnlace)
  }

  async crearEnlace(nuevo: NuevoEnlace): Promise<EnlaceEditable> {
    const datos = await this.http.enviar({ metodo: 'POST', ruta: '/institucional/enlaces/', cuerpo: cuerpoDeEnlace(nuevo) })
    return aEnlace(EnlaceDto.parse(datos))
  }

  async actualizarEnlace(id: number, cambios: Partial<NuevoEnlace>): Promise<EnlaceEditable> {
    const datos = await this.http.enviar({ metodo: 'PATCH', ruta: `/institucional/enlaces/${id}/`, cuerpo: cuerpoDeEnlace(cambios) })
    return aEnlace(EnlaceDto.parse(datos))
  }

  async eliminarEnlace(id: number): Promise<void> {
    await this.http.enviar({ metodo: 'DELETE', ruta: `/institucional/enlaces/${id}/` })
  }
}
