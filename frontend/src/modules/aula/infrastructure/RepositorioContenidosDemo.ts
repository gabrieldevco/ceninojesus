import type {
  Actividad,
  ArchivoDeContenido,
  Material,
  NuevaActividad,
  NuevoMaterial,
  TipoContenido,
} from '../domain/contenido'
import type { Calificacion, Entrega, NuevaEntrega } from '../domain/entrega'
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
const enDias = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10)

const ESTUDIANTE_DEMO = 900

function entregaDemo(
  id: number,
  actividadId: number,
  estudianteId: number,
  estudianteNombre: string,
  texto: string,
  extra: Partial<Entrega> = {},
): Entrega {
  return {
    id,
    actividadId,
    estudianteId,
    estudianteNombre,
    texto,
    url: '',
    tieneArchivo: false,
    archivoNombre: '',
    fechaEntrega: new Date(Date.now() - 86_400_000).toISOString(),
    tarde: false,
    calificacion: null,
    comentarioDocente: '',
    fechaCalificacion: null,
    ...extra,
  }
}

/** Contenido de demostración (modo sin backend): vive en memoria y no tiene archivos reales. */
export class RepositorioContenidosDemo implements RepositorioContenidos {
  private siguienteId = 100
  private listaMateriales: Material[] = [
    material(1, 1, 'documento', 'Guía: el tablero y las piezas'),
    { ...material(2, 1, 'video', 'Cómo se mueve cada pieza'), url: 'https://www.youtube.com/watch?v=OCSbzArwB10' },
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
    {
      id: 2,
      grupoId: 1,
      titulo: 'Resuelve el mate en dos jugadas',
      descripcion: 'Analiza el diagrama adjunto y escribe la secuencia de jugadas que da jaque mate en dos movimientos.',
      url: '',
      tieneArchivo: false,
      fechaPublicacion: hoy(),
      publicado: true,
      fechaEntrega: enDias(7),
    },
  ]

  /** Entregas de ejemplo: el estudiante de la demo es el 900; los demás son compañeros. */
  private listaEntregas: Entrega[] = [
    entregaDemo(1, 1, 900, 'Estudiante demo A', 'Movería el caballo a f3 para proteger al rey y controlar el centro.', { calificacion: 4.5, comentarioDocente: '¡Muy buen análisis! Revisa también la defensa del alfil.' }),
    entregaDemo(2, 1, 901, 'Sofía Martínez', 'Elegiría avanzar el peón de e4 para abrir paso a la dama.'),
    entregaDemo(3, 1, 902, 'Mateo Rodríguez', '', { url: 'https://lichess.org/estudio-demo', tarde: true }),
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

  misEntregas(grupoId: number): Promise<Entrega[]> {
    const ids = new Set(this.listaActividades.filter((a) => a.grupoId === grupoId).map((a) => a.id))
    return Promise.resolve(this.listaEntregas.filter((e) => e.estudianteId === ESTUDIANTE_DEMO && ids.has(e.actividadId)))
  }

  entregar(nueva: NuevaEntrega): Promise<Entrega> {
    const actual = this.listaEntregas.find((e) => e.actividadId === nueva.actividadId && e.estudianteId === ESTUDIANTE_DEMO)
    if (actual?.calificacion !== null && actual?.calificacion !== undefined) {
      return Promise.reject(new Error('Esta entrega ya fue calificada: no se puede modificar.'))
    }
    const actividad = this.listaActividades.find((a) => a.id === nueva.actividadId)
    const entrega: Entrega = {
      ...entregaDemo(actual?.id ?? this.siguienteId++, nueva.actividadId, ESTUDIANTE_DEMO, 'Estudiante demo A', nueva.texto, {
        url: nueva.url,
        tarde: Boolean(actividad?.fechaEntrega && hoy() > actividad.fechaEntrega),
        fechaEntrega: new Date().toISOString(),
      }),
      tieneArchivo: nueva.archivo !== null || Boolean(actual?.tieneArchivo),
      archivoNombre: nueva.archivo?.name ?? actual?.archivoNombre ?? '',
    }
    this.listaEntregas = [entrega, ...this.listaEntregas.filter((e) => e.id !== entrega.id)]
    return Promise.resolve(entrega)
  }

  entregas(_grupoId: number, actividadId: number): Promise<Entrega[]> {
    return Promise.resolve(this.listaEntregas.filter((e) => e.actividadId === actividadId))
  }

  calificar(c: Calificacion): Promise<Entrega> {
    const entrega = this.listaEntregas.find((e) => e.id === c.entregaId)
    if (!entrega) return Promise.reject(new Error('No existe la entrega.'))
    Object.assign(entrega, { calificacion: c.calificacion, comentarioDocente: c.comentario, fechaCalificacion: new Date().toISOString() })
    return Promise.resolve({ ...entrega })
  }

  descargarEntrega(): Promise<ArchivoDeContenido> {
    return Promise.reject(new Error('En modo demostración no hay archivos para descargar'))
  }

  eliminar(tipo: TipoContenido, _grupoId: number, contenidoId: number): Promise<void> {
    if (tipo === 'materiales') this.listaMateriales = this.listaMateriales.filter((m) => m.id !== contenidoId)
    else this.listaActividades = this.listaActividades.filter((a) => a.id !== contenidoId)
    return Promise.resolve()
  }
}
