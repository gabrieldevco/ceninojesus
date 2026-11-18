import { cargaDiferida } from '@/shared/ui/cargaDiferida'
import type { HttpClient } from '@/shared/http/HttpClient'
import {
  CambiarEstadoInteresado,
  ListarInteresados,
  ListarSeguimientos,
  RegistrarInteresado,
  RegistrarSeguimiento,
} from './application/casosDeUso'
import type { RepositorioInteresados } from './domain/puertos'
import { RepositorioInteresadosDemo } from './infrastructure/RepositorioInteresadosDemo'
import { RepositorioInteresadosHoja } from './infrastructure/RepositorioInteresadosHoja'
import { RepositorioInteresadosHttp } from './infrastructure/RepositorioInteresadosHttp'
import type { CasosDeUsoInteresados } from './presentation/InteresadosProvider'

export { InteresadosProvider } from './presentation/InteresadosProvider'
// Las páginas se cargan al visitar su ruta: no pesan en la carga inicial del sitio
export const AdmisionesPage = cargaDiferida(() => import('./presentation/AdmisionesPage'))
export const GestionInteresadosPage = cargaDiferida(() => import('./presentation/GestionInteresadosPage'))

export function crearCasosDeUsoInteresados({
  http,
  modoDemo,
  formulariosUrl = '',
  fetchImpl,
}: {
  http: HttpClient
  modoDemo: boolean
  /** Sin backend: si hay hoja de cálculo, el formulario de admisiones llega ahí. */
  formulariosUrl?: string
  fetchImpl?: typeof fetch
}): CasosDeUsoInteresados {
  const repositorio: RepositorioInteresados = !modoDemo
    ? new RepositorioInteresadosHttp(http)
    : formulariosUrl
      ? new RepositorioInteresadosHoja(formulariosUrl, fetchImpl)
      : new RepositorioInteresadosDemo()
  return {
    registrarInteresado: new RegistrarInteresado(repositorio),
    listarInteresados: new ListarInteresados(repositorio),
    cambiarEstadoInteresado: new CambiarEstadoInteresado(repositorio),
    listarSeguimientos: new ListarSeguimientos(repositorio),
    registrarSeguimiento: new RegistrarSeguimiento(repositorio),
  }
}
