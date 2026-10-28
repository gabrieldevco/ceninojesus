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
import { RepositorioInteresadosHttp } from './infrastructure/RepositorioInteresadosHttp'
import type { CasosDeUsoInteresados } from './presentation/InteresadosProvider'

export { InteresadosProvider } from './presentation/InteresadosProvider'
export { default as AdmisionesPage } from './presentation/AdmisionesPage'
export { default as GestionInteresadosPage } from './presentation/GestionInteresadosPage'

export function crearCasosDeUsoInteresados({ http, modoDemo }: { http: HttpClient; modoDemo: boolean }): CasosDeUsoInteresados {
  const repositorio: RepositorioInteresados = modoDemo ? new RepositorioInteresadosDemo() : new RepositorioInteresadosHttp(http)
  return {
    registrarInteresado: new RegistrarInteresado(repositorio),
    listarInteresados: new ListarInteresados(repositorio),
    cambiarEstadoInteresado: new CambiarEstadoInteresado(repositorio),
    listarSeguimientos: new ListarSeguimientos(repositorio),
    registrarSeguimiento: new RegistrarSeguimiento(repositorio),
  }
}
