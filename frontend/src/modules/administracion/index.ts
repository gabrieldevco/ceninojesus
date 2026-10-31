import type { HttpClient } from '@/shared/http/HttpClient'
import {
  ActualizarGrupo,
  ActualizarUsuario,
  AnonimizarUsuario,
  AsignarAdministradores,
  CrearGrupo,
  CrearUsuario,
  ListarGruposAdministrables,
  ListarUsuarios,
} from './application/casosDeUso'
import type { RepositorioAdministracion } from './domain/puertos'
import { RepositorioAdministracionDemo } from './infrastructure/RepositorioAdministracionDemo'
import { RepositorioAdministracionHttp } from './infrastructure/RepositorioAdministracionHttp'
import type { CasosDeUsoAdministracion } from './presentation/AdministracionProvider'

export { AdministracionProvider } from './presentation/AdministracionProvider'
export { default as PanelAdministracionPage } from './presentation/PanelAdministracionPage'

export function crearCasosDeUsoAdministracion({
  http,
  modoDemo,
}: {
  http: HttpClient
  modoDemo: boolean
}): CasosDeUsoAdministracion {
  const repositorio: RepositorioAdministracion = modoDemo ? new RepositorioAdministracionDemo() : new RepositorioAdministracionHttp(http)
  return {
    listarUsuarios: new ListarUsuarios(repositorio),
    crearUsuario: new CrearUsuario(repositorio),
    actualizarUsuario: new ActualizarUsuario(repositorio),
    anonimizarUsuario: new AnonimizarUsuario(repositorio),
    listarGrupos: new ListarGruposAdministrables(repositorio),
    crearGrupo: new CrearGrupo(repositorio),
    actualizarGrupo: new ActualizarGrupo(repositorio),
    asignarAdministradores: new AsignarAdministradores(repositorio),
  }
}
