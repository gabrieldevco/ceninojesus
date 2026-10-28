import type { RepositorioInteresados } from '../domain/puertos'

/** Modo sin backend: acepta el formulario sin guardar nada. */
export class RepositorioInteresadosDemo implements RepositorioInteresados {
  registrar(): Promise<void> {
    return Promise.resolve()
  }
}
