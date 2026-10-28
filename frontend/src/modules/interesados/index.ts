import type { HttpClient } from '@/shared/http/HttpClient'
import { RegistrarInteresado } from './application/casosDeUso'
import type { RepositorioInteresados } from './domain/puertos'
import { RepositorioInteresadosDemo } from './infrastructure/RepositorioInteresadosDemo'
import { RepositorioInteresadosHttp } from './infrastructure/RepositorioInteresadosHttp'
import type { CasosDeUsoInteresados } from './presentation/InteresadosProvider'

export { InteresadosProvider } from './presentation/InteresadosProvider'
export { default as AdmisionesPage } from './presentation/AdmisionesPage'

export function crearCasosDeUsoInteresados({ http, modoDemo }: { http: HttpClient; modoDemo: boolean }): CasosDeUsoInteresados {
  const repositorio: RepositorioInteresados = modoDemo ? new RepositorioInteresadosDemo() : new RepositorioInteresadosHttp(http)
  return { registrarInteresado: new RegistrarInteresado(repositorio) }
}
