import { validarNuevoEstudiante, type Estudiante, type NuevoEstudiante } from '../domain/estudiante'
import type { RepositorioEstudiantes } from '../domain/puertos'

export class ListarEstudiantes {
  constructor(private readonly repositorio: RepositorioEstudiantes) {}

  ejecutar(): Promise<Estudiante[]> {
    return this.repositorio.listar()
  }
}

/** El acudiente registra a sus estudiantes y autoriza el tratamiento de sus datos. */
export class RegistrarEstudiante {
  constructor(private readonly repositorio: RepositorioEstudiantes) {}

  async ejecutar(nuevo: NuevoEstudiante): Promise<Estudiante> {
    return this.repositorio.registrar(validarNuevoEstudiante(nuevo))
  }
}
