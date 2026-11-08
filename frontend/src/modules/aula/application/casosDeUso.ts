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
import {
  leerCalificacion,
  validarNuevaEntrega,
  type Entrega,
  type NuevaEntrega,
} from '../domain/entrega'
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

export class ListarMisEntregas {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(grupoId: number): Promise<Entrega[]> {
    return this.repositorio.misEntregas(grupoId)
  }
}

/** El estudiante entrega su trabajo: texto, archivo o enlace. */
export class EntregarActividad {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(nueva: NuevaEntrega, yaTieneArchivo = false): Promise<Entrega> {
    return this.repositorio.entregar(validarNuevaEntrega(nueva, yaTieneArchivo))
  }
}

export class ListarEntregas {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(grupoId: number, actividadId: number): Promise<Entrega[]> {
    return this.repositorio.entregas(grupoId, actividadId)
  }
}

/** El docente califica de 0.0 a 5.0 (acepta "4,5") y deja un comentario. */
export class CalificarEntrega {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(datos: { grupoId: number; actividadId: number; entregaId: number; nota: string; comentario: string }): Promise<Entrega> {
    return this.repositorio.calificar({
      grupoId: datos.grupoId,
      actividadId: datos.actividadId,
      entregaId: datos.entregaId,
      calificacion: leerCalificacion(datos.nota),
      comentario: datos.comentario.trim(),
    })
  }
}

export class DescargarEntrega {
  constructor(private readonly repositorio: RepositorioContenidos) {}

  ejecutar(grupoId: number, actividadId: number, entregaId: number): Promise<ArchivoDeContenido> {
    return this.repositorio.descargarEntrega(grupoId, actividadId, entregaId)
  }
}
