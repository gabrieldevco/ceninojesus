import type { Grupo } from './grupo'

export interface RepositorioGrupos {
  listar(): Promise<Grupo[]>
}
