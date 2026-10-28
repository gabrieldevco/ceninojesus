import type { Grupo } from '../domain/grupo'
import type { RepositorioGrupos } from '../domain/puertos'

export class ListarGrupos {
  constructor(private readonly repositorio: RepositorioGrupos) {}

  ejecutar(): Promise<Grupo[]> {
    return this.repositorio.listar()
  }
}

export class ListarMisGrupos {
  constructor(private readonly repositorio: RepositorioGrupos) {}

  ejecutar(): Promise<Grupo[]> {
    return this.repositorio.listarMios()
  }
}
