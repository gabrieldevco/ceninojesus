import type { Estudiante, NuevoAcceso, NuevoEstudiante } from './estudiante'

export interface RepositorioEstudiantes {
  /** Los estudiantes vinculados al usuario con sesión. */
  listar(): Promise<Estudiante[]>
  registrar(nuevo: NuevoEstudiante): Promise<Estudiante>
  /** Crea el usuario con el que el estudiante entra a ver el contenido de sus grupos. */
  crearAcceso(estudianteId: number, acceso: NuevoAcceso): Promise<Estudiante>
  /** El estudiante no suele tener correo: su acudiente le asigna una contraseña nueva. */
  restablecerClave(estudianteId: number, clave: string): Promise<void>
}
