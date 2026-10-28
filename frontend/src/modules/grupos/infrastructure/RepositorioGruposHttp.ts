import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { Grupo } from '../domain/grupo'
import type { RepositorioGrupos } from '../domain/puertos'

const GrupoDto = z.object({
  id: z.number(),
  nombre: z.string(),
  descripcion: z.string().optional().default(''),
  horario: z.string().optional().default(''),
  cupo_maximo: z.number().nullable().optional().default(null),
})
const ListaDto = z.array(GrupoDto)

function aEntidad(dto: z.infer<typeof GrupoDto>): Grupo {
  return { id: dto.id, nombre: dto.nombre, descripcion: dto.descripcion, horario: dto.horario, cupoMaximo: dto.cupo_maximo }
}

export class RepositorioGruposHttp implements RepositorioGrupos {
  constructor(private readonly http: HttpClient) {}

  async listar(): Promise<Grupo[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/grupos/', autenticada: false })
    return ListaDto.parse(datos).map(aEntidad)
  }

  async listarMios(): Promise<Grupo[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/grupos/mis-grupos/' })
    return ListaDto.parse(datos).map(aEntidad)
  }
}
