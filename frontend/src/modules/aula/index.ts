import { lazy } from 'react'
import type { HttpClient } from '@/shared/http/HttpClient'
import {
  DescargarArchivo,
  EliminarContenido,
  ListarActividades,
  ListarMateriales,
  PublicarActividad,
  PublicarMaterial,
} from './application/casosDeUso'
import type { RepositorioContenidos } from './domain/puertos'
import { RepositorioContenidosDemo } from './infrastructure/RepositorioContenidosDemo'
import { RepositorioContenidosHttp } from './infrastructure/RepositorioContenidosHttp'
import type { CasosDeUsoAula } from './presentation/AulaProvider'

export { AulaProvider } from './presentation/AulaProvider'
// Las páginas se cargan al visitar su ruta: no pesan en la carga inicial del sitio
export const AulaPage = lazy(() => import('./presentation/AulaPage'))
export const GestionContenidoPage = lazy(() => import('./presentation/GestionContenidoPage'))

export function crearCasosDeUsoAula({ http, modoDemo }: { http: HttpClient; modoDemo: boolean }): CasosDeUsoAula {
  const repositorio: RepositorioContenidos = modoDemo ? new RepositorioContenidosDemo() : new RepositorioContenidosHttp(http)
  return {
    listarMateriales: new ListarMateriales(repositorio),
    listarActividades: new ListarActividades(repositorio),
    descargarArchivo: new DescargarArchivo(repositorio),
    publicarMaterial: new PublicarMaterial(repositorio),
    publicarActividad: new PublicarActividad(repositorio),
    eliminarContenido: new EliminarContenido(repositorio),
  }
}
