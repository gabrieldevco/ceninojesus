import type { Actividad, ArchivoDeContenido, Material, TipoContenido } from '../domain/contenido'
import type { RepositorioContenidos } from '../domain/puertos'

export class ListarMateriales {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(grupoId: number): Promise<Material[]> {
    return this.repositorio.materiales(grupoId)
  }
}

export class ListarActividades {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(grupoId: number): Promise<Actividad[]> {
    return this.repositorio.actividades(grupoId)
  }
}

export class DescargarArchivo {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<ArchivoDeContenido> {
    return this.repositorio.descargarArchivo(tipo, grupoId, contenidoId)
  }
}
