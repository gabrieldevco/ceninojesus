import type { HttpClient } from '@/shared/http/HttpClient'
import { ListarGrupos, ListarMisGrupos } from './application/casosDeUso'
import type { RepositorioGrupos } from './domain/puertos'
import { RepositorioGruposDemo } from './infrastructure/RepositorioGruposDemo'
import { RepositorioGruposHttp } from './infrastructure/RepositorioGruposHttp'
import type { CasosDeUsoGrupos } from './presentation/GruposProvider'

export type { Grupo } from './domain/grupo'
export { GruposProvider, iconoDeGrupo, useGrupos, useMisGrupos } from './presentation/GruposProvider'

export function crearCasosDeUsoGrupos({ http, modoDemo }: { http: HttpClient; modoDemo: boolean }): CasosDeUsoGrupos {
  const repositorio: RepositorioGrupos = modoDemo ? new RepositorioGruposDemo() : new RepositorioGruposHttp(http)
  return { listarGrupos: new ListarGrupos(repositorio), listarMisGrupos: new ListarMisGrupos(repositorio) }
}
