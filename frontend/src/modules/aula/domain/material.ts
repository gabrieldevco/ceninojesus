export type TipoMaterial = 'doc' | 'video' | 'link'

export interface Material {
  id: number
  tipo: TipoMaterial
  titulo: string
  detalle: string
  etiqueta: string
  accion: string
}

export interface RepositorioMateriales {
  listarPorGrupo(grupo: string): Promise<Material[]>
}
