import { validarNuevoGrupo, type Grupo, type NuevoGrupo } from '../domain/grupo'
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

export class CrearGrupo {
  constructor(private readonly repositorio: RepositorioGrupos) {}

  ejecutar(nuevo: NuevoGrupo): Promise<Grupo> {
    return this.repositorio.crear(validarNuevoGrupo(nuevo))
  }
}
