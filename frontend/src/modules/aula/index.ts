import type { HttpClient } from '@/shared/http/HttpClient'
import { DescargarArchivo, ListarActividades, ListarMateriales } from './application/casosDeUso'
import type { RepositorioContenidos } from './domain/puertos'
import { RepositorioContenidosDemo } from './infrastructure/RepositorioContenidosDemo'
import { RepositorioContenidosHttp } from './infrastructure/RepositorioContenidosHttp'
import type { CasosDeUsoAula } from './presentation/AulaProvider'

export { AulaProvider } from './presentation/AulaProvider'
export { default as AulaPage } from './presentation/AulaPage'

export function crearCasosDeUsoAula({ http, modoDemo }: { http: HttpClient; modoDemo: boolean }): CasosDeUsoAula {
  const repositorio: RepositorioContenidos = modoDemo ? new RepositorioContenidosDemo() : new RepositorioContenidosHttp(http)
  return {
    listarMateriales: new ListarMateriales(repositorio),
    listarActividades: new ListarActividades(repositorio),
    descargarArchivo: new DescargarArchivo(repositorio),
  }
}
