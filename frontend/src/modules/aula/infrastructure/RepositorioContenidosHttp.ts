import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { Actividad, ArchivoDeContenido, Material, TipoContenido } from '../domain/contenido'
import type { RepositorioContenidos } from '../domain/puertos'

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const BaseDto = z.object({
  id: z.number(),
  grupo_id: z.number(),
  titulo: z.string(),
  descripcion: z.string().nullish().transform((v) => v ?? ''),
  url: z.string().nullish().transform((v) => v ?? ''),
  archivo_url: z.string().nullable().optional().default(null),
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
})

export class RepositorioContenidosHttp implements RepositorioContenidos {
  constructor(private readonly http: HttpClient) {}

  async materiales(grupoId: number): Promise<Material[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: `/grupos/${grupoId}/materiales/` })
    return z
      .array(MaterialDto)
      .parse(datos)
      .map((dto) => ({ ...base(dto), tipo: dto.tipo }))
  }

  async actividades(grupoId: number): Promise<Actividad[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: `/grupos/${grupoId}/actividades/` })
    return z
      .array(ActividadDto)
      .parse(datos)
      .map((dto) => ({ ...base(dto), fechaEntrega: dto.fecha_entrega?.slice(0, 10) ?? null }))
  }

  async descargarArchivo(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<ArchivoDeContenido> {
    const archivo = await this.http.descargar({ ruta: `/grupos/${grupoId}/${tipo}/${contenidoId}/archivo/` })
    return { contenido: archivo.contenido, nombre: archivo.nombre }
  }
}
