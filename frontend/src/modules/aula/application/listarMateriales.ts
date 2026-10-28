import type { Material, RepositorioMateriales } from '../domain/material'

export class ListarMateriales {
  constructor(private readonly repositorio: RepositorioMateriales) {}

  ejecutar(grupo: string): Promise<Material[]> {
    return this.repositorio.listarPorGrupo(grupo)
  }
}
