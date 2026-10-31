import { CONTENIDO_POR_DEFECTO } from '../domain/contenidoPorDefecto'
import type {
  CambiosDeElemento,
  ContenidoLanding,
  ElementoLanding,
  InformacionLanding,
  NuevoElemento,
  SeccionDeImagen,
} from '../domain/landing'
import type { RepositorioSitio } from '../domain/puertosSitio'
import type { EnlaceEditable, NuevoEnlace } from '../domain/sitio'

/** Vista previa de una imagen subida: en el navegador; en pruebas (sin esa API) se deja la ruta anterior. */
const vistaPrevia = (archivo: File, anterior: string): string =>
  typeof URL.createObjectURL === 'function' ? URL.createObjectURL(archivo) : anterior

/** Contenido de la página en memoria (modo sin backend): parte del contenido por defecto y se puede editar. */
export class RepositorioSitioDemo implements RepositorioSitio {
  private siguienteId = 1000
  private informacion: InformacionLanding = { ...CONTENIDO_POR_DEFECTO.informacion }
  private elementos: ElementoLanding[] = CONTENIDO_POR_DEFECTO.elementos.map((e) => ({ ...e }))
  private enlaces: EnlaceEditable[] = [
    { id: 1, nombre: 'Biblioteca', url: 'https://biblioteca.example.com', tipo: 'biblioteca', descripcion: '', requiereAutenticacion: true, orden: 0, activo: true },
  ]

  obtenerContenido(): Promise<ContenidoLanding> {
    return Promise.resolve({ informacion: { ...this.informacion }, elementos: this.elementos.filter((e) => e.activo).map((e) => ({ ...e })) })
  }

  actualizarInformacion(cambios: Partial<InformacionLanding>): Promise<InformacionLanding> {
    this.informacion = { ...this.informacion, ...cambios }
    return Promise.resolve({ ...this.informacion })
  }

  listarElementos(): Promise<ElementoLanding[]> {
    return Promise.resolve(this.elementos.map((e) => ({ ...e })))
  }

  crearElemento(nuevo: NuevoElemento): Promise<ElementoLanding> {
    const creado: ElementoLanding = { id: this.siguienteId++, ...nuevo, imagen: '', tieneImagenSubida: false }
    this.elementos = [...this.elementos, creado]
    return Promise.resolve({ ...creado })
  }

  actualizarElemento(id: number, cambios: CambiosDeElemento): Promise<ElementoLanding> {
    return this.cambiar(id, (e) => ({ ...e, ...cambios }))
  }

  eliminarElemento(id: number): Promise<void> {
    this.elementos = this.elementos.filter((e) => e.id !== id)
    return Promise.resolve()
  }

  subirImagen(id: number, archivo: File): Promise<ElementoLanding> {
    return this.cambiar(id, (e) => ({ ...e, imagen: vistaPrevia(archivo, e.imagen), tieneImagenSubida: true }))
  }

  quitarImagen(id: number): Promise<ElementoLanding> {
    const original = CONTENIDO_POR_DEFECTO.elementos.find((e) => e.id === id)?.imagen ?? ''
    return this.cambiar(id, (e) => ({ ...e, imagen: original, tieneImagenSubida: false }))
  }

  reemplazarImagenUnica(seccion: SeccionDeImagen, archivo: File): Promise<ElementoLanding> {
    const existente = this.elementos.find((e) => e.seccion === seccion)
    if (existente) return this.subirImagen(existente.id, archivo)
    const creado: ElementoLanding = {
      id: this.siguienteId++,
      seccion,
      titulo: '',
      texto: '',
      detalle: '',
      icono: '',
      imagen: vistaPrevia(archivo, ''),
      tieneImagenSubida: true,
      orden: 0,
      activo: true,
    }
    this.elementos = [...this.elementos, creado]
    return Promise.resolve({ ...creado })
  }

  listarEnlacesEditables(): Promise<EnlaceEditable[]> {
    return Promise.resolve(this.enlaces.map((e) => ({ ...e })))
  }

  crearEnlace(nuevo: NuevoEnlace): Promise<EnlaceEditable> {
    const creado = { id: this.siguienteId++, ...nuevo }
    this.enlaces = [...this.enlaces, creado]
    return Promise.resolve({ ...creado })
  }

  actualizarEnlace(id: number, cambios: Partial<NuevoEnlace>): Promise<EnlaceEditable> {
    const actual = this.enlaces.find((e) => e.id === id)
    if (!actual) return Promise.reject(new Error('Enlace no encontrado.'))
    const nuevo = { ...actual, ...cambios }
    this.enlaces = this.enlaces.map((e) => (e.id === id ? nuevo : e))
    return Promise.resolve({ ...nuevo })
  }

  eliminarEnlace(id: number): Promise<void> {
    this.enlaces = this.enlaces.filter((e) => e.id !== id)
    return Promise.resolve()
  }

  private cambiar(id: number, cambio: (e: ElementoLanding) => ElementoLanding): Promise<ElementoLanding> {
    const actual = this.elementos.find((e) => e.id === id)
    if (!actual) return Promise.reject(new Error('Elemento no encontrado.'))
    const nuevo = cambio(actual)
    this.elementos = this.elementos.map((e) => (e.id === id ? nuevo : e))
    return Promise.resolve({ ...nuevo })
  }
}
