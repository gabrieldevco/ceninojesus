import { ListarGrupos } from './application/listarGrupos'
import { RepositorioGruposDemo } from './infrastructure/RepositorioGruposDemo'
import type { CasosDeUsoGrupos } from './presentation/GruposProvider'

export type { Grupo } from './domain/grupo'
export { GruposProvider, useGrupos } from './presentation/GruposProvider'

export function crearCasosDeUsoGrupos(): CasosDeUsoGrupos {
  return { listarGrupos: new ListarGrupos(new RepositorioGruposDemo()) }
}
