import type { HttpClient } from '@/shared/http/HttpClient'
import { EnviarMensajeDeContacto, ListarEnlaces, ObtenerPoliticaDeDatos } from './application/casosDeUso'
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
import { RepositorioInstitucionalHttp } from './infrastructure/RepositorioInstitucionalHttp'
import type { CasosDeUsoInstitucional } from './presentation/InstitucionalProvider'

export type { Enlace } from './domain/contacto'
export { CONTENIDO_POR_DEFECTO } from './domain/contenidoPorDefecto'
export type { InformacionLanding } from './domain/landing'
export { InstitucionalProvider, useContenidoLanding, useEnlaces } from './presentation/InstitucionalProvider'
export { default as GestionSitioPage } from './presentation/GestionSitioPage'
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
  const sitio: RepositorioSitio = modoDemo ? new RepositorioSitioDemo() : new RepositorioSitioHttp(http)
  return {
    enviarMensaje: new EnviarMensajeDeContacto(repositorio),
    obtenerPolitica: new ObtenerPoliticaDeDatos(repositorio),
    listarEnlaces: new ListarEnlaces(repositorio),
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
