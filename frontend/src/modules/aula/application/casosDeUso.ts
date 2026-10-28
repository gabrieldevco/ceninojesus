import {
  validarNuevaActividad,
  validarNuevoMaterial,
  type Actividad,
  type ArchivoDeContenido,
  type Material,
  type NuevaActividad,
  type NuevoMaterial,
  type TipoContenido,
} from '../domain/contenido'
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

/** RF-12: el administrador del grupo publica material de apoyo. */
export class PublicarMaterial {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  async ejecutar(nuevo: NuevoMaterial): Promise<Material> {
    return this.repositorio.crearMaterial(validarNuevoMaterial(nuevo))
  }
}

/** RF-13: el administrador del grupo publica actividades para los estudiantes inscritos. */
export class PublicarActividad {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  async ejecutar(nueva: NuevaActividad): Promise<Actividad> {
    return this.repositorio.crearActividad(validarNuevaActividad(nueva))
  }
}

export class EliminarContenido {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<void> {
    return this.repositorio.eliminar(tipo, grupoId, contenidoId)
  }
}
