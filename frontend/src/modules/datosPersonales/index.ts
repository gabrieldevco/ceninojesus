import { cargaDiferida } from '@/shared/ui/cargaDiferida'
import type { HttpClient } from '@/shared/http/HttpClient'
import {
  ListarSolicitudesDeDatos,
  RadicarSolicitudDeDatos,
  ResponderSolicitudDeDatos,
  TramitarSolicitudDeDatos,
} from './application/casosDeUso'
import type { RepositorioSolicitudesDeDatos } from './domain/puertos'
import { RepositorioSolicitudesDeDatosDemo } from './infrastructure/RepositorioSolicitudesDeDatosDemo'
import { RepositorioSolicitudesDeDatosHttp } from './infrastructure/RepositorioSolicitudesDeDatosHttp'
import type { CasosDeUsoDatosPersonales } from './presentation/DatosPersonalesProvider'

export { DatosPersonalesProvider } from './presentation/DatosPersonalesProvider'
// Las páginas se cargan al visitar su ruta: no pesan en la carga inicial del sitio
export const SolicitudDeDatosPage = cargaDiferida(() => import('./presentation/SolicitudDeDatosPage'))
export const GestionSolicitudesDatosPage = cargaDiferida(() => import('./presentation/GestionSolicitudesDatosPage'))

export function crearCasosDeUsoDatosPersonales({
  http,
  modoDemo,
}: {
  http: HttpClient
  modoDemo: boolean
}): CasosDeUsoDatosPersonales {
  const repositorio: RepositorioSolicitudesDeDatos = modoDemo
    ? new RepositorioSolicitudesDeDatosDemo()
    : new RepositorioSolicitudesDeDatosHttp(http)
  return {
    radicarSolicitud: new RadicarSolicitudDeDatos(repositorio),
    listarSolicitudes: new ListarSolicitudesDeDatos(repositorio),
    tramitarSolicitud: new TramitarSolicitudDeDatos(repositorio),
    responderSolicitud: new ResponderSolicitudDeDatos(repositorio),
  }
}
