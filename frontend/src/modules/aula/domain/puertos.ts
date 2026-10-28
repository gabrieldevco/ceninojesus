import type { Actividad, ArchivoDeContenido, Material, TipoContenido } from './contenido'

export interface RepositorioContenidos {
  /** Solo los publicados del grupo, y solo si el usuario puede verlos (matrícula aprobada o administrador). */
  materiales(grupoId: number): Promise<Material[]>
  actividades(grupoId: number): Promise<Actividad[]>
  descargarArchivo(tipo: TipoContenido, grupoId: number, contenidoId: number): Promise<ArchivoDeContenido>
}
