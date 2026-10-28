import {
  validarNuevaClave,
  validarNuevoAcceso,
  validarNuevoEstudiante,
  type Estudiante,
  type NuevoAcceso,
  type NuevoEstudiante,
} from '../domain/estudiante'
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

/** El acudiente crea el usuario con el que su estudiante entra al aula. */
export class CrearAccesoEstudiante {
  constructor(private readonly repositorio: RepositorioEstudiantes) {}

  async ejecutar(estudianteId: number, acceso: NuevoAcceso): Promise<Estudiante> {
    return this.repositorio.crearAcceso(estudianteId, validarNuevoAcceso(acceso))
  }
}

export class RestablecerClaveEstudiante {
  constructor(private readonly repositorio: RepositorioEstudiantes) {}

  async ejecutar(estudianteId: number, clave: string, confirmacion: string): Promise<void> {
    await this.repositorio.restablecerClave(estudianteId, validarNuevaClave(clave, confirmacion))
  }
}
