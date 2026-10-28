import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type {
  Actividad,
  ArchivoDeContenido,
  Material,
  NuevaActividad,
  NuevoMaterial,
  TipoContenido,
} from '../domain/contenido'
import type { RepositorioContenidos } from '../domain/puertos'

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const BaseDto = z.object({
  id: z.number(),
  grupo_id: z.number(),
  titulo: z.string(),
  descripcion: z.string().nullish().transform((v) => v ?? ''),
  url: z.string().nullish().transform((v) => v ?? ''),
  archivo_url: z.string().nullable().optional().default(null),
  publicado: z.boolean().default(true),
  fecha_publicacion: z.string(),
})
const MaterialDto = BaseDto.extend({ tipo: z.enum(['documento', 'video', 'enlace']).default('documento') })
const ActividadDto = BaseDto.extend({ fecha_entrega: z.string().nullable().optional().default(null) })

const base = (dto: z.infer<typeof BaseDto>) => ({
  id: dto.id,
  grupoId: dto.grupo_id,
  titulo: dto.titulo,
  descripcion: dto.descripcion,
  url: dto.url,
  tieneArchivo: Boolean(dto.archivo_url),
  fechaPublicacion: dto.fecha_publicacion.slice(0, 10),
  publicado: dto.publicado,
})

const aMaterial = (dto: z.infer<typeof MaterialDto>): Material => ({ ...base(dto), tipo: dto.tipo })
const aActividad = (dto: z.infer<typeof ActividadDto>): Actividad => ({
  ...base(dto),
  fechaEntrega: dto.fecha_entrega?.slice(0, 10) ?? null,
})

/** Arma el multipart que espera la API; el archivo solo se adjunta si hay uno. */
function formulario(campos: Record<string, string | boolean | null>, archivo: File | null): FormData {
  const datos = new FormData()
  for (const [nombre, valor] of Object.entries(campos)) {
    if (valor !== null && valor !== '') datos.append(nombre, String(valor))
  }
  if (archivo) datos.append('archivo', archivo)
  return datos
}

export class RepositorioContenidosHttp implements RepositorioContenidos {
  constructor(private readonly http: HttpClient) {}

  async materiales(grupoId: number): Promise<Material[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: `/grupos/${grupoId}/materiales/` })
    return z.array(MaterialDto).parse(datos).map(aMaterial)
  }

  async actividades(grupoId: number): Promise<Actividad[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: `/grupos/${grupoId}/actividades/` })
    return z.array(ActividadDto).parse(datos).map(aActividad)
  }

  async descargarArchivo(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<ArchivoDeContenido> {
    const archivo = await this.http.descargar({ ruta: `/grupos/${grupoId}/${tipo}/${contenidoId}/archivo/` })
    return { contenido: archivo.contenido, nombre: archivo.nombre }
  }

  async crearMaterial(nuevo: NuevoMaterial): Promise<Material> {
    const datos = await this.http.enviar({
      metodo: 'POST',
      ruta: `/grupos/${nuevo.grupoId}/materiales/`,
      cuerpo: formulario(
        { titulo: nuevo.titulo, descripcion: nuevo.descripcion, tipo: nuevo.tipo, url: nuevo.url, publicado: nuevo.publicado },
        nuevo.archivo,
      ),
    })
    return aMaterial(MaterialDto.parse(datos))
  }

  async crearActividad(nueva: NuevaActividad): Promise<Actividad> {
    const datos = await this.http.enviar({
      metodo: 'POST',
      ruta: `/grupos/${nueva.grupoId}/actividades/`,
      cuerpo: formulario(
        {
          titulo: nueva.titulo,
          descripcion: nueva.descripcion,
          url: nueva.url,
          publicado: nueva.publicado,
          // La API espera fecha y hora: la entrega vence al final del día elegido
          fecha_entrega: nueva.fechaEntrega ? `${nueva.fechaEntrega}T23:59:00` : null,
        },
        nueva.archivo,
      ),
    })
    return aActividad(ActividadDto.parse(datos))
  }

  async eliminar(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<void> {
    await this.http.enviar({ metodo: 'DELETE', ruta: `/grupos/${grupoId}/${tipo}/${contenidoId}/` })
  }
}
