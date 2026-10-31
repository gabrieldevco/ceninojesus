import type {
  CambiosDeElemento,
  ContenidoLanding,
  ElementoLanding,
  InformacionLanding,
  NuevoElemento,
  SeccionDeImagen,
} from '../domain/landing'
import { validarElemento, validarImagen } from '../domain/landing'
import type { RepositorioSitio } from '../domain/puertosSitio'
import { validarDireccionesWeb, validarEnlace, type EnlaceEditable, type NuevoEnlace } from '../domain/sitio'

export class ObtenerContenidoLanding {
  constructor(private readonly repositorio: RepositorioSitio) {}

  ejecutar(): Promise<ContenidoLanding> {
    return this.repositorio.obtenerContenido()
  }
}

export class ActualizarInformacion {
  constructor(private readonly repositorio: RepositorioSitio) {}

  async ejecutar(cambios: Partial<InformacionLanding>): Promise<InformacionLanding> {
    validarDireccionesWeb(cambios)
    return this.repositorio.actualizarInformacion(cambios)
  }
}

export class ListarElementosDelSitio {
  constructor(private readonly repositorio: RepositorioSitio) {}

  ejecutar(): Promise<ElementoLanding[]> {
    return this.repositorio.listarElementos()
  }
}

export class CrearElemento {
  constructor(private readonly repositorio: RepositorioSitio) {}

  async ejecutar(nuevo: NuevoElemento): Promise<ElementoLanding> {
    return this.repositorio.crearElemento(validarElemento(nuevo.seccion, nuevo))
  }
}

export class ActualizarElemento {
  constructor(private readonly repositorio: RepositorioSitio) {}

  async ejecutar(elemento: Pick<ElementoLanding, 'id' | 'seccion'>, cambios: CambiosDeElemento): Promise<ElementoLanding> {
    const seccion = elemento.seccion
    if (seccion === 'imagen_portada' || seccion === 'imagen_quienes' || seccion === 'imagen_enfoque') {
      throw new Error('Las imágenes únicas se reemplazan, no se editan.')
    }
    return this.repositorio.actualizarElemento(elemento.id, validarElemento(seccion, cambios))
  }
}

export class EliminarElemento {
  constructor(private readonly repositorio: RepositorioSitio) {}

  ejecutar(id: number): Promise<void> {
    return this.repositorio.eliminarElemento(id)
  }
}

export class SubirImagenDeElemento {
  constructor(private readonly repositorio: RepositorioSitio) {}

  async ejecutar(id: number, archivo: File): Promise<ElementoLanding> {
    validarImagen(archivo)
    return this.repositorio.subirImagen(id, archivo)
  }
}

export class QuitarImagenDeElemento {
  constructor(private readonly repositorio: RepositorioSitio) {}

  ejecutar(id: number): Promise<ElementoLanding> {
    return this.repositorio.quitarImagen(id)
  }
}

export class ReemplazarImagenUnica {
  constructor(private readonly repositorio: RepositorioSitio) {}

  async ejecutar(seccion: SeccionDeImagen, archivo: File): Promise<ElementoLanding> {
    validarImagen(archivo)
    return this.repositorio.reemplazarImagenUnica(seccion, archivo)
  }
}

export class ListarEnlacesEditables {
  constructor(private readonly repositorio: RepositorioSitio) {}

  ejecutar(): Promise<EnlaceEditable[]> {
    return this.repositorio.listarEnlacesEditables()
  }
}

export class CrearEnlace {
  constructor(private readonly repositorio: RepositorioSitio) {}

  async ejecutar(nuevo: NuevoEnlace): Promise<EnlaceEditable> {
    return this.repositorio.crearEnlace(validarEnlace(nuevo))
  }
}

export class ActualizarEnlace {
  constructor(private readonly repositorio: RepositorioSitio) {}

  async ejecutar(id: number, cambios: Partial<NuevoEnlace>): Promise<EnlaceEditable> {
    return this.repositorio.actualizarEnlace(id, validarEnlace(cambios))
  }
}

export class EliminarEnlace {
  constructor(private readonly repositorio: RepositorioSitio) {}

  ejecutar(id: number): Promise<void> {
    return this.repositorio.eliminarEnlace(id)
  }
}
