import type { EstadoInteresado, Interesado, NuevoInteresado, Seguimiento } from './interesado'

export interface RepositorioInteresados {
  /** Formulario público de admisiones: no requiere sesión. */
  registrar(nuevo: NuevoInteresado): Promise<void>

  // Solo el administrador general:
  listar(): Promise<Interesado[]>
  cambiarEstado(id: number, estado: EstadoInteresado): Promise<Interesado>
  listarSeguimientos(id: number): Promise<Seguimiento[]>
  registrarSeguimiento(id: number, nota: string): Promise<Seguimiento>
}
