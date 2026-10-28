import type { RepositorioAutenticacion } from '../domain/puertos'
import type { Usuario } from '../domain/usuario'

export class IniciarSesion {
  constructor(private readonly repositorio: RepositorioAutenticacion) {}

  ejecutar(identificador: string, clave: string): Promise<Usuario | null> {
    return this.repositorio.iniciarSesion(identificador.trim(), clave)
  }
}

export class ObtenerSesion {
  constructor(private readonly repositorio: RepositorioAutenticacion) {}

  ejecutar(): Promise<Usuario | null> {
    return this.repositorio.obtenerSesion()
  }
}

export class CerrarSesion {
  constructor(private readonly repositorio: RepositorioAutenticacion) {}

  ejecutar(): Promise<void> {
    return this.repositorio.cerrarSesion()
  }
}

export class SolicitarRecuperacion {
  constructor(private readonly repositorio: RepositorioAutenticacion) {}

  ejecutar(identificador: string): Promise<void> {
    return this.repositorio.solicitarRecuperacion(identificador.trim())
  }
}
