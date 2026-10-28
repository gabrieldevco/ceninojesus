import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import { EnviarSolicitud, ListarEstudiantes, ListarSolicitudes, ResolverSolicitud } from './application/casosDeUso'
import { RepositorioSolicitudesDemo } from './infrastructure/RepositorioSolicitudesDemo'
import type { CasosDeUsoMatriculas } from './presentation/MatriculasProvider'

export type { EstadoSolicitud, SolicitudMatricula } from './domain/solicitud'
export { MatriculasProvider, useSolicitudes } from './presentation/MatriculasProvider'
export { default as MatriculaPage } from './presentation/MatriculaPage'
export { default as SolicitudesPage } from './presentation/SolicitudesPage'

export function crearCasosDeUsoMatriculas(almacenamiento: Almacenamiento): CasosDeUsoMatriculas {
  const repositorio = new RepositorioSolicitudesDemo(almacenamiento)
  return {
    listarSolicitudes: new ListarSolicitudes(repositorio),
    enviarSolicitud: new EnviarSolicitud(repositorio),
    resolverSolicitud: new ResolverSolicitud(repositorio),
    listarEstudiantes: new ListarEstudiantes(repositorio),
  }
}
