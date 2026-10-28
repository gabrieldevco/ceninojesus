import type { Estudiante, NuevoEstudiante } from './estudiante'

export interface RepositorioEstudiantes {
  /** Los estudiantes vinculados al usuario con sesión. */
  listar(): Promise<Estudiante[]>
  registrar(nuevo: NuevoEstudiante): Promise<Estudiante>
}
