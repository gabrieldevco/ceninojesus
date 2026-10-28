import type { HttpClient } from '@/shared/http/HttpClient'
import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import { EnviarSolicitud, ListarSolicitudes, ResolverSolicitud } from './application/casosDeUso'
import type { RepositorioSolicitudes } from './domain/puertos'
import { RepositorioSolicitudesDemo } from './infrastructure/RepositorioSolicitudesDemo'
import { RepositorioSolicitudesHttp } from './infrastructure/RepositorioSolicitudesHttp'
import type { CasosDeUsoMatriculas } from './presentation/MatriculasProvider'

export type { EstadoSolicitud, SolicitudMatricula } from './domain/solicitud'
export { MatriculasProvider, useSolicitudes } from './presentation/MatriculasProvider'
export { default as MatriculaPage } from './presentation/MatriculaPage'
export { default as SolicitudesPage } from './presentation/SolicitudesPage'

export function crearCasosDeUsoMatriculas({
  http,
  almacenamiento,
  modoDemo,
}: {
  http: HttpClient
  almacenamiento: Almacenamiento
  modoDemo: boolean
}): CasosDeUsoMatriculas {
  const repositorio: RepositorioSolicitudes = modoDemo
    ? new RepositorioSolicitudesDemo(almacenamiento)
    : new RepositorioSolicitudesHttp(http)
  return {
    listarSolicitudes: new ListarSolicitudes(repositorio),
    enviarSolicitud: new EnviarSolicitud(repositorio),
    resolverSolicitud: new ResolverSolicitud(repositorio),
  }
}
