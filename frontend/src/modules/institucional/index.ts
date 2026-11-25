import { cargaDiferida } from '@/shared/ui/cargaDiferida'
import type { HttpClient } from '@/shared/http/HttpClient'
import {
  EnviarMensajeDeContacto,
  ListarEnlaces,
  ListarMensajesContacto,
  MarcarMensajeContactoLeido,
  ObtenerPoliticaDeDatos,
} from './application/casosDeUso'
import {
  ActualizarElemento,
  ActualizarEnlace,
  ActualizarInformacion,
  CrearElemento,
  CrearEnlace,
  EliminarElemento,
  EliminarEnlace,
  ListarElementosDelSitio,
  ListarEnlacesEditables,
  ObtenerContenidoLanding,
  QuitarImagenDeElemento,
  ReemplazarImagenUnica,
  SubirImagenDeElemento,
} from './application/casosDeUsoSitio'
import type { RepositorioSitio } from './domain/puertosSitio'
import { RepositorioSitioDemo } from './infrastructure/RepositorioSitioDemo'
import { RepositorioSitioHttp } from './infrastructure/RepositorioSitioHttp'
import type { RepositorioInstitucional } from './domain/puertos'
import { RepositorioInstitucionalDemo } from './infrastructure/RepositorioInstitucionalDemo'
import { RepositorioInstitucionalHoja } from './infrastructure/RepositorioInstitucionalHoja'
import { RepositorioInstitucionalHttp } from './infrastructure/RepositorioInstitucionalHttp'
import type { CasosDeUsoInstitucional } from './presentation/InstitucionalProvider'

export type { Enlace, MensajeContactoRecibido } from './domain/contacto'
export { CONTENIDO_POR_DEFECTO } from './domain/contenidoPorDefecto'
export type { InformacionLanding } from './domain/landing'
export {
  InstitucionalProvider,
  useContenidoLanding,
  useEnlaces,
  useMarcarMensajeContactoLeido,
  useMensajesContacto,
} from './presentation/InstitucionalProvider'
// Las páginas se cargan al visitar su ruta: no pesan en la carga inicial del sitio
export const BandejaContactoPage = cargaDiferida(() => import('./presentation/BandejaContactoPage'))
export const GestionSitioPage = cargaDiferida(() => import('./presentation/GestionSitioPage'))
export { default as InicioPage } from './presentation/InicioPage'
export const PoliticaDatosPage = cargaDiferida(() => import('./presentation/PoliticaDatosPage'))

export function crearCasosDeUsoInstitucional({
  http,
  modoDemo,
  formulariosUrl = '',
  fetchImpl,
}: {
  http: HttpClient
  modoDemo: boolean
  /** Sin backend: si hay hoja de cálculo, el formulario de contacto llega ahí. */
  formulariosUrl?: string
  fetchImpl?: typeof fetch
}): CasosDeUsoInstitucional {
  const repositorio: RepositorioInstitucional = !modoDemo
    ? new RepositorioInstitucionalHttp(http)
    : formulariosUrl
      ? new RepositorioInstitucionalHoja(formulariosUrl, fetchImpl)
      : new RepositorioInstitucionalDemo()
  const sitio: RepositorioSitio = modoDemo ? new RepositorioSitioDemo() : new RepositorioSitioHttp(http)
  return {
    enviarMensaje: new EnviarMensajeDeContacto(repositorio),
    obtenerPolitica: new ObtenerPoliticaDeDatos(repositorio),
    listarEnlaces: new ListarEnlaces(repositorio),
    listarMensajesContacto: new ListarMensajesContacto(repositorio),
    marcarMensajeContactoLeido: new MarcarMensajeContactoLeido(repositorio),
    sitio: {
      obtenerContenido: new ObtenerContenidoLanding(sitio),
      actualizarInformacion: new ActualizarInformacion(sitio),
      listarElementos: new ListarElementosDelSitio(sitio),
      crearElemento: new CrearElemento(sitio),
      actualizarElemento: new ActualizarElemento(sitio),
      eliminarElemento: new EliminarElemento(sitio),
      subirImagen: new SubirImagenDeElemento(sitio),
      quitarImagen: new QuitarImagenDeElemento(sitio),
      reemplazarImagenUnica: new ReemplazarImagenUnica(sitio),
      listarEnlacesEditables: new ListarEnlacesEditables(sitio),
      crearEnlace: new CrearEnlace(sitio),
      actualizarEnlace: new ActualizarEnlace(sitio),
      eliminarEnlace: new EliminarEnlace(sitio),
    },
  }
}
