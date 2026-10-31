import type {
  Actividad,
  ArchivoDeContenido,
  Material,
  NuevaActividad,
  NuevoMaterial,
  TipoContenido,
} from './contenido'

export interface RepositorioContenidos {
  /** Quien administra el grupo ve todo (también borradores); el estudiante aprobado, solo lo publicado. */
  materiales(grupoId: number): Promise<Material[]>
  actividades(grupoId: number): Promise<Actividad[]>
  descargarArchivo(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<ArchivoDeContenido>
  /** Solo quien administra el grupo. */
  crearMaterial(nuevo: NuevoMaterial): Promise<Material>
  crearActividad(nueva: NuevaActividad): Promise<Actividad>
  eliminar(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<void>
}
