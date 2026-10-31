import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { EstadoInteresado, Interesado, NuevoInteresado, Seguimiento } from '../domain/interesado'
import type { RepositorioInteresados } from '../domain/puertos'

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const InteresadoDto = z.object({
  id: z.number(),
  nombre_completo: z.string(),
  correo: z.string(),
  telefono: z.string(),
  mensaje: z.string().nullish().transform((v) => v ?? ''),
  nombre_aspirante: z.string().nullish().transform((v) => v ?? ''),
  grado_interes: z.string().nullish().transform((v) => v ?? ''),
  estado: z.enum(['nuevo', 'en_seguimiento', 'matriculado', 'descartado']),
  fecha_registro: z.string(),
  fecha_ultimo_contacto: z.string().nullable().default(null),
})
const SeguimientoDto = z.object({ id: z.number(), nota: z.string(), fecha: z.string() })

const dia = (fechaHora: string) => fechaHora.slice(0, 10)

function aInteresado(dto: z.infer<typeof InteresadoDto>): Interesado {
  return {
    id: dto.id,
    nombreCompleto: dto.nombre_completo,
    correo: dto.correo,
    telefono: dto.telefono,
    mensaje: dto.mensaje,
    nombreAspirante: dto.nombre_aspirante,
    gradoInteres: dto.grado_interes,
    estado: dto.estado,
    fechaRegistro: dia(dto.fecha_registro),
    fechaUltimoContacto: dto.fecha_ultimo_contacto ? dia(dto.fecha_ultimo_contacto) : null,
  }
}

const aSeguimiento = (dto: z.infer<typeof SeguimientoDto>): Seguimiento => ({ id: dto.id, nota: dto.nota, fecha: dia(dto.fecha) })

export class RepositorioInteresadosHttp implements RepositorioInteresados {
  constructor(private readonly http: HttpClient) {}

  async registrar(nuevo: NuevoInteresado): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: '/interesados/',
      autenticada: false,
      cuerpo: {
        nombre_completo: nuevo.nombreCompleto,
        correo: nuevo.correo,
        telefono: nuevo.telefono,
        nombre_aspirante: nuevo.nombreAspirante,
        grado_interes: nuevo.gradoInteres,
        mensaje: nuevo.mensaje,
        autoriza_tratamiento_datos: nuevo.autorizaTratamientoDatos,
      },
    })
  }

  async listar(): Promise<Interesado[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/interesados/' })
    return z.array(InteresadoDto).parse(datos).map(aInteresado)
  }

  async cambiarEstado(id: number, estado: EstadoInteresado): Promise<Interesado> {
    const datos = await this.http.enviar({ metodo: 'PATCH', ruta: `/interesados/${id}/estado/`, cuerpo: { estado } })
    return aInteresado(InteresadoDto.parse(datos))
  }

  async listarSeguimientos(id: number): Promise<Seguimiento[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: `/interesados/${id}/seguimientos/` })
    return z.array(SeguimientoDto).parse(datos).map(aSeguimiento)
  }

  async registrarSeguimiento(id: number, nota: string): Promise<Seguimiento> {
    const datos = await this.http.enviar({ metodo: 'POST', ruta: `/interesados/${id}/seguimientos/`, cuerpo: { nota } })
    return aSeguimiento(SeguimientoDto.parse(datos))
  }
}
