import type { CatalogoMatricula, RepositorioSolicitudes } from '../domain/puertos'
import {
  buscarDuplicada,
  SolicitudDuplicada,
  validarMotivoRechazo,
  type NuevaSolicitud,
  type SolicitudMatricula,
} from '../domain/solicitud'

export class ListarSolicitudes {
  constructor(private readonly repositorio: RepositorioSolicitudes) {}

  ejecutar(): Promise<SolicitudMatricula[]> {
    return this.repositorio.listar()
  }
}

/** RF-07: el acudiente solicita la matrícula; no se permiten solicitudes repetidas (RF-10). */
export class EnviarSolicitud {
  constructor(private readonly repositorio: RepositorioSolicitudes) {}

  async ejecutar(nueva: NuevaSolicitud): Promise<SolicitudMatricula> {
    const existentes = await this.repositorio.listar()
    const duplicada = buscarDuplicada(existentes, nueva)
    if (duplicada) throw new SolicitudDuplicada(duplicada)
    return this.repositorio.crear(nueva)
  }
}

/** RF-09: el administrador del grupo aprueba o rechaza; el rechazo exige motivo. */
export class ResolverSolicitud {
  constructor(private readonly repositorio: RepositorioSolicitudes) {}

  aprobar(id: number): Promise<SolicitudMatricula> {
    return this.repositorio.resolver(id, 'aprobada')
  }

  async rechazar(id: number, motivo: string): Promise<SolicitudMatricula> {
    return this.repositorio.resolver(id, 'rechazada', validarMotivoRechazo(motivo))
  }
}

export class ListarEstudiantes {
  constructor(private readonly catalogo: CatalogoMatricula) {}

  ejecutar(): Promise<string[]> {
    return this.catalogo.estudiantes()
  }
}
