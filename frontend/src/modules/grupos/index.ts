import type { HttpClient } from '@/shared/http/HttpClient'
import { CrearGrupo, ListarGrupos, ListarMisGrupos } from './application/casosDeUso'
import type { RepositorioGrupos } from './domain/puertos'
import { RepositorioGruposDemo } from './infrastructure/RepositorioGruposDemo'
import { RepositorioGruposHttp } from './infrastructure/RepositorioGruposHttp'
import type { CasosDeUsoGrupos } from './presentation/GruposProvider'

export type { Grupo, NuevoGrupo } from './domain/grupo'
export { GrupoInvalido } from './domain/grupo'
export { GruposProvider, iconoDeGrupo, useCrearGrupo, useGrupos, useMisGrupos } from './presentation/GruposProvider'

export function crearCasosDeUsoGrupos({ http, modoDemo }: { http: HttpClient; modoDemo: boolean }): CasosDeUsoGrupos {
  const repositorio: RepositorioGrupos = modoDemo ? new RepositorioGruposDemo() : new RepositorioGruposHttp(http)
  return {
    listarGrupos: new ListarGrupos(repositorio),
    listarMisGrupos: new ListarMisGrupos(repositorio),
    crearGrupo: new CrearGrupo(repositorio),
  }
}
