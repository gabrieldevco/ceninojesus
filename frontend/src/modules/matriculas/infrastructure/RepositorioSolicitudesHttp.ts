import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { RepositorioSolicitudes } from '../domain/puertos'
import type { EstadoSolicitud, NuevaSolicitud, SolicitudMatricula } from '../domain/solicitud'

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const SolicitudDto = z.object({
  id: z.number(),
  grupo_id: z.number(),
  grupo_nombre: z.string(),
  estudiante_id: z.number(),
  estudiante_nombre: z.string(),
  comentario: z.string().default(''),
  estado: z.enum(['pendiente', 'aprobada', 'rechazada']),
  respuesta: z.string().default(''),
  fecha_solicitud: z.string(),
})

function aEntidad(dto: z.infer<typeof SolicitudDto>): SolicitudMatricula {
  return {
    id: dto.id,
    estudianteId: dto.estudiante_id,
    estudiante: dto.estudiante_nombre,
    grupoId: dto.grupo_id,
    grupo: dto.grupo_nombre,
    comentario: dto.comentario,
    fecha: dto.fecha_solicitud.slice(0, 10),
    estado: dto.estado,
    // En la API la "respuesta" es el motivo cuando se rechaza
    ...(dto.estado === 'rechazada' && dto.respuesta ? { motivo: dto.respuesta } : {}),
  }
}

export class RepositorioSolicitudesHttp implements RepositorioSolicitudes {
  constructor(private readonly http: HttpClient) {}

  async listar(): Promise<SolicitudMatricula[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/matriculas/' })
    return z.array(SolicitudDto).parse(datos).map(aEntidad)
  }

  async crear(nueva: NuevaSolicitud): Promise<SolicitudMatricula> {
    const datos = await this.http.enviar({
      metodo: 'POST',
      ruta: '/matriculas/',
      cuerpo: { grupo_id: nueva.grupoId, estudiante_id: nueva.estudianteId, comentario: nueva.comentario ?? '' },
    })
    return aEntidad(SolicitudDto.parse(datos))
  }

  async resolver(
    id: number,
    estado: Exclude<EstadoSolicitud, 'pendiente'>,
    motivo?: string,
  ): Promise<SolicitudMatricula> {
    const datos = await this.http.enviar(
      estado === 'aprobada'
        ? { metodo: 'POST', ruta: `/matriculas/${id}/aprobar/`, cuerpo: {} }
        : { metodo: 'POST', ruta: `/matriculas/${id}/rechazar/`, cuerpo: { motivo: motivo ?? '' } },
    )
    return aEntidad(SolicitudDto.parse(datos))
  }
}
