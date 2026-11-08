import {
  validarNuevoMensaje,
  type Enlace,
  type MensajeContactoRecibido,
  type NuevoMensaje,
  type PoliticaDeDatos,
} from '../domain/contacto'
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

export class ListarEnlaces {
  constructor(private readonly repositorio: RepositorioInstitucional) {}

  ejecutar(): Promise<Enlace[]> {
    return this.repositorio.listarEnlaces()
  }
}

export class ListarMensajesContacto {
  constructor(private readonly repositorio: RepositorioInstitucional) {}

  ejecutar(soloNoLeidos?: boolean): Promise<MensajeContactoRecibido[]> {
    return this.repositorio.listarMensajesContacto(soloNoLeidos)
  }
}

export class MarcarMensajeContactoLeido {
  constructor(private readonly repositorio: RepositorioInstitucional) {}

  ejecutar(id: number): Promise<void> {
    return this.repositorio.marcarMensajeContactoLeido(id)
  }
}
