import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { RepositorioSolicitudesDeDatos } from '../domain/puertos'
import type { NuevaSolicitud, SolicitudDeDatos } from '../domain/solicitud'

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const SolicitudDto = z.object({
  id: z.number(),
  nombre: z.string(),
  correo: z.string(),
  documento_identidad: z.string().nullish().transform((v) => v ?? ''),
  tipo: z.enum(['consulta', 'actualizacion', 'rectificacion', 'supresion', 'revocatoria']),
  descripcion: z.string(),
  estado: z.enum(['recibida', 'en_tramite', 'resuelta']),
  respuesta: z.string().nullish().transform((v) => v ?? ''),
  fecha_solicitud: z.string(),
  fecha_limite: z.string(),
  fecha_respuesta: z.string().nullable().default(null),
})

const dia = (fechaHora: string) => fechaHora.slice(0, 10)

const aSolicitud = (dto: z.infer<typeof SolicitudDto>): SolicitudDeDatos => ({
  id: dto.id,
  nombre: dto.nombre,
  correo: dto.correo,
  documentoIdentidad: dto.documento_identidad,
  tipo: dto.tipo,
  descripcion: dto.descripcion,
  estado: dto.estado,
  respuesta: dto.respuesta,
  fechaSolicitud: dia(dto.fecha_solicitud),
  fechaLimite: dto.fecha_limite,
  fechaRespuesta: dto.fecha_respuesta ? dia(dto.fecha_respuesta) : null,
})

export class RepositorioSolicitudesDeDatosHttp implements RepositorioSolicitudesDeDatos {
  constructor(private readonly http: HttpClient) {}

  async radicar(nueva: NuevaSolicitud): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: '/datos-personales/solicitudes/',
      autenticada: false,
      cuerpo: {
        nombre: nueva.nombre,
        correo: nueva.correo,
        documento_identidad: nueva.documentoIdentidad,
        tipo: nueva.tipo,
        descripcion: nueva.descripcion,
      },
    })
  }

  async listar(): Promise<SolicitudDeDatos[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/datos-personales/solicitudes/' })
    return z.array(SolicitudDto).parse(datos).map(aSolicitud)
  }

  async tramitar(id: number): Promise<SolicitudDeDatos> {
    const datos = await this.http.enviar({ metodo: 'POST', ruta: `/datos-personales/solicitudes/${id}/tramitar/` })
    return aSolicitud(SolicitudDto.parse(datos))
  }

  async responder(id: number, respuesta: string): Promise<SolicitudDeDatos> {
    const datos = await this.http.enviar({
      metodo: 'POST',
      ruta: `/datos-personales/solicitudes/${id}/responder/`,
      cuerpo: { respuesta },
    })
    return aSolicitud(SolicitudDto.parse(datos))
  }
}
