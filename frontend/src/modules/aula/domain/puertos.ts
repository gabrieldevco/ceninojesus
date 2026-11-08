import type {
  Actividad,
  ArchivoDeContenido,
  Material,
  NuevaActividad,
  NuevoMaterial,
  TipoContenido,
} from './contenido'
import type { Calificacion, Entrega, NuevaEntrega } from './entrega'

export interface RepositorioContenidos {
  /** Quien administra el grupo ve todo (también borradores); el estudiante aprobado, solo lo publicado. */
  materiales(grupoId: number): Promise<Material[]>
  actividades(grupoId: number): Promise<Actividad[]>
  descargarArchivo(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<ArchivoDeContenido>
  /** Solo quien administra el grupo. */
  crearMaterial(nuevo: NuevoMaterial): Promise<Material>
  crearActividad(nueva: NuevaActividad): Promise<Actividad>
  eliminar(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<void>

  // --- Entregas ---
  /** Estudiante: sus entregas en las actividades publicadas del grupo. */
  misEntregas(grupoId: number): Promise<Entrega[]>
  /** Estudiante: entrega o reemplaza su trabajo mientras no esté calificado. */
  entregar(nueva: NuevaEntrega): Promise<Entrega>
  /** Docente del grupo: todas las entregas de una actividad. */
  entregas(grupoId: number, actividadId: number): Promise<Entrega[]>
  calificar(calificacion: Calificacion): Promise<Entrega>
  descargarEntrega(grupoId: number, actividadId: number, entregaId: number): Promise<ArchivoDeContenido>
}
