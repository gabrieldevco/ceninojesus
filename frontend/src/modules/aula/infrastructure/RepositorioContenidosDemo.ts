import type {
  Actividad,
  ArchivoDeContenido,
  Material,
  NuevaActividad,
  NuevoMaterial,
  TipoContenido,
} from '../domain/contenido'
import type { RepositorioContenidos } from '../domain/puertos'

const material = (id: number, grupoId: number, tipo: Material['tipo'], titulo: string): Material => ({
  id,
  grupoId,
  tipo,
  titulo,
  descripcion: 'Material de demostración.',
  url: '',
  tieneArchivo: false,
  fechaPublicacion: '2026-10-01',
  publicado: true,
})

const hoy = () => new Date().toISOString().slice(0, 10)

/** Contenido de demostración (modo sin backend): vive en memoria y no tiene archivos reales. */
export class RepositorioContenidosDemo implements RepositorioContenidos {
  private siguienteId = 100
  private listaMateriales: Material[] = [
    material(1, 1, 'documento', 'Guía: el tablero y las piezas'),
    material(2, 1, 'video', 'Cómo se mueve cada pieza'),
    material(3, 1, 'enlace', 'Explora posiciones de apertura'),
    material(4, 3, 'documento', 'Ritmos y compases: introducción'),
    material(5, 3, 'video', 'Calentamiento en 10 minutos'),
  ]

  private listaActividades: Actividad[] = [
    {
      id: 1,
      grupoId: 1,
      titulo: 'Piensa tu próxima jugada',
      descripcion:
        'Observa una posición del tablero y compara dos movimientos posibles. Explica cuál elegirías y qué pieza necesitas proteger.',
      url: '',
      tieneArchivo: false,
      fechaPublicacion: '2026-10-03',
      publicado: true,
      fechaEntrega: '2026-10-08',
    },
  ]

  materiales(grupoId: number): Promise<Material[]> {
    return Promise.resolve(this.listaMateriales.filter((m) => m.grupoId === grupoId))
  }

  actividades(grupoId: number): Promise<Actividad[]> {
    return Promise.resolve(this.listaActividades.filter((a) => a.grupoId === grupoId))
  }

  descargarArchivo(): Promise<ArchivoDeContenido> {
    return Promise.reject(new Error('En modo demostración no hay archivos para descargar'))
  }

  crearMaterial(nuevo: NuevoMaterial): Promise<Material> {
    const creado: Material = {
      id: this.siguienteId++,
      grupoId: nuevo.grupoId,
      tipo: nuevo.tipo,
      titulo: nuevo.titulo,
      descripcion: nuevo.descripcion,
      url: nuevo.url,
      tieneArchivo: nuevo.archivo !== null,
      fechaPublicacion: hoy(),
      publicado: nuevo.publicado,
    }
    this.listaMateriales = [creado, ...this.listaMateriales]
    return Promise.resolve(creado)
  }

  crearActividad(nueva: NuevaActividad): Promise<Actividad> {
    const creada: Actividad = {
      id: this.siguienteId++,
      grupoId: nueva.grupoId,
      titulo: nueva.titulo,
      descripcion: nueva.descripcion,
      url: nueva.url,
      tieneArchivo: nueva.archivo !== null,
      fechaPublicacion: hoy(),
      publicado: nueva.publicado,
      fechaEntrega: nueva.fechaEntrega,
    }
    this.listaActividades = [creada, ...this.listaActividades]
    return Promise.resolve(creada)
  }

  eliminar(tipo: TipoContenido, _grupoId: number, contenidoId: number): Promise<void> {
    if (tipo === 'materiales') this.listaMateriales = this.listaMateriales.filter((m) => m.id !== contenidoId)
    else this.listaActividades = this.listaActividades.filter((a) => a.id !== contenidoId)
    return Promise.resolve()
  }
}
