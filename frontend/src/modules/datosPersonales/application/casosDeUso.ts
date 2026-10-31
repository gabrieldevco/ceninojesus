import type { RepositorioSolicitudesDeDatos } from '../domain/puertos'
import { validarNuevaSolicitud, validarRespuesta, type NuevaSolicitud, type SolicitudDeDatos } from '../domain/solicitud'

/** El titular ejerce sus derechos de la Ley 1581: consultar, actualizar, rectificar, suprimir o revocar. */
export class RadicarSolicitudDeDatos {
  constructor(private readonly repositorio: RepositorioSolicitudesDeDatos) {}

  async ejecutar(nueva: NuevaSolicitud): Promise<void> {
    await this.repositorio.radicar(validarNuevaSolicitud(nueva))
  }
}

export class ListarSolicitudesDeDatos {
  constructor(private readonly repositorio: RepositorioSolicitudesDeDatos) {}

  ejecutar(): Promise<SolicitudDeDatos[]> {
    return this.repositorio.listar()
  }
}

export class TramitarSolicitudDeDatos {
  constructor(private readonly repositorio: RepositorioSolicitudesDeDatos) {}

  ejecutar(id: number): Promise<SolicitudDeDatos> {
    return this.repositorio.tramitar(id)
  }
}

export class ResponderSolicitudDeDatos {
  constructor(private readonly repositorio: RepositorioSolicitudesDeDatos) {}

  async ejecutar(id: number, respuesta: string): Promise<SolicitudDeDatos> {
    return this.repositorio.responder(id, validarRespuesta(respuesta))
  }
}
