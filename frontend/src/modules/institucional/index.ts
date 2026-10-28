import type { HttpClient } from '@/shared/http/HttpClient'
import { EnviarMensajeDeContacto, ListarEnlaces, ObtenerPoliticaDeDatos } from './application/casosDeUso'
import type { RepositorioInstitucional } from './domain/puertos'
import { RepositorioInstitucionalDemo } from './infrastructure/RepositorioInstitucionalDemo'
import { RepositorioInstitucionalHttp } from './infrastructure/RepositorioInstitucionalHttp'
import type { CasosDeUsoInstitucional } from './presentation/InstitucionalProvider'

export type { Enlace } from './domain/contacto'
export { InstitucionalProvider, useEnlaces } from './presentation/InstitucionalProvider'
export { default as InicioPage } from './presentation/InicioPage'
export { default as PoliticaDatosPage } from './presentation/PoliticaDatosPage'

export function crearCasosDeUsoInstitucional({
  http,
  modoDemo,
}: {
  http: HttpClient
  modoDemo: boolean
}): CasosDeUsoInstitucional {
  const repositorio: RepositorioInstitucional = modoDemo ? new RepositorioInstitucionalDemo() : new RepositorioInstitucionalHttp(http)
  return {
    enviarMensaje: new EnviarMensajeDeContacto(repositorio),
    obtenerPolitica: new ObtenerPoliticaDeDatos(repositorio),
    listarEnlaces: new ListarEnlaces(repositorio),
  }
}
