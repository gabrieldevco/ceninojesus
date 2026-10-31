import type {
  CambiosDeElemento,
  ContenidoLanding,
  ElementoLanding,
  InformacionLanding,
  NuevoElemento,
  SeccionDeImagen,
} from './landing'
import type { EnlaceEditable, NuevoEnlace } from './sitio'

/** Contenido de la página de inicio: lo lee cualquier visitante y lo edita el administrador general. */
export interface RepositorioSitio {
  /** Público: textos e imágenes de la página, solo lo visible. */
  obtenerContenido(): Promise<ContenidoLanding>

  actualizarInformacion(cambios: Partial<InformacionLanding>): Promise<InformacionLanding>
  /** Incluye los elementos ocultos. */
  listarElementos(): Promise<ElementoLanding[]>
  crearElemento(nuevo: NuevoElemento): Promise<ElementoLanding>
  actualizarElemento(id: number, cambios: CambiosDeElemento): Promise<ElementoLanding>
  eliminarElemento(id: number): Promise<void>
  subirImagen(id: number, archivo: File): Promise<ElementoLanding>
  /** El elemento vuelve a mostrar la imagen incluida con el sitio, si tiene. */
  quitarImagen(id: number): Promise<ElementoLanding>
  /** Portada, "quiénes somos" o enfoque: solo hay una; se crea o se reemplaza. */
  reemplazarImagenUnica(seccion: SeccionDeImagen, archivo: File): Promise<ElementoLanding>

  listarEnlacesEditables(): Promise<EnlaceEditable[]>
  crearEnlace(nuevo: NuevoEnlace): Promise<EnlaceEditable>
  actualizarEnlace(id: number, cambios: Partial<NuevoEnlace>): Promise<EnlaceEditable>
  eliminarEnlace(id: number): Promise<void>
}
