import { validarNuevoMensaje, type NuevoMensaje, type PoliticaDeDatos } from '../domain/contacto'
import type { RepositorioInstitucional } from '../domain/puertos'

/** RF-03: cualquier visitante le escribe al colegio. */
export class EnviarMensajeDeContacto {
  constructor(private readonly repositorio: RepositorioInstitucional) {}

  async ejecutar(nuevo: NuevoMensaje): Promise<void> {
    await this.repositorio.enviarMensaje(validarNuevoMensaje(nuevo))
  }
}

export class ObtenerPoliticaDeDatos {
  constructor(private readonly repositorio: RepositorioInstitucional) {}

  ejecutar(): Promise<PoliticaDeDatos> {
    return this.repositorio.politicaDeDatos()
  }
}
