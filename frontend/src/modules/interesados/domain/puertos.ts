import type { NuevoInteresado } from './interesado'

export interface RepositorioInteresados {
  /** Formulario público de admisiones: no requiere sesión. */
  registrar(nuevo: NuevoInteresado): Promise<void>
}
