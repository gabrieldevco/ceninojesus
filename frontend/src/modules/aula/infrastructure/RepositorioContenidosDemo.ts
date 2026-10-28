import type { Actividad, ArchivoDeContenido, Material } from '../domain/contenido'
import type { RepositorioContenidos } from '../domain/puertos'

const material = (id: number, grupoId: number, tipo: Material['tipo'], titulo: string, url: string): Material => ({
  id,
  grupoId,
  tipo,
  titulo,
  descripcion: 'Material de demostración.',
  url,
  tieneArchivo: false,
  fechaPublicacion: '2026-10-01',
})

const MATERIALES_DEMO: Material[] = [
  material(1, 1, 'documento', 'Guía: el tablero y las piezas', ''),
  material(2, 1, 'video', 'Cómo se mueve cada pieza', ''),
  material(3, 1, 'enlace', 'Explora posiciones de apertura', ''),
  material(4, 3, 'documento', 'Ritmos y compases: introducción', ''),
  material(5, 3, 'video', 'Calentamiento en 10 minutos', ''),
]

const ACTIVIDADES_DEMO: Actividad[] = [
  {
    id: 1,
    grupoId: 1,
    titulo: 'Piensa tu próxima jugada',
    descripcion:
      'Observa una posición del tablero y compara dos movimientos posibles. Explica cuál elegirías y qué pieza necesitas proteger.',
    url: '',
    tieneArchivo: false,
    fechaPublicacion: '2026-10-03',
    fechaEntrega: '2026-10-08',
  },
]

/** Contenido de demostración (modo sin backend): no tiene archivos ni enlaces reales. */
export class RepositorioContenidosDemo implements RepositorioContenidos {
  materiales(grupoId: number): Promise<Material[]> {
    return Promise.resolve(MATERIALES_DEMO.filter((m) => m.grupoId === grupoId))
  }

  actividades(grupoId: number): Promise<Actividad[]> {
    return Promise.resolve(ACTIVIDADES_DEMO.filter((a) => a.grupoId === grupoId))
  }

  descargarArchivo(): Promise<ArchivoDeContenido> {
    return Promise.reject(new Error('En modo demostración no hay archivos para descargar'))
  }
}
