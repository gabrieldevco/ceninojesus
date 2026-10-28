import { validarNuevoInteresado, type NuevoInteresado } from '../domain/interesado'
import type { RepositorioInteresados } from '../domain/puertos'

/** RF-16: una persona interesada en la matrícula deja sus datos para que admisiones la contacte. */
export class RegistrarInteresado {
  constructor(private readonly repositorio: RepositorioInteresados) {}

  async ejecutar(nuevo: NuevoInteresado): Promise<void> {
    await this.repositorio.registrar(validarNuevoInteresado(nuevo))
  }
}
