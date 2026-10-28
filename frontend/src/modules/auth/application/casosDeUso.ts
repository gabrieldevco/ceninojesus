import type { RepositorioAutenticacion } from '../domain/puertos'
import type { Usuario } from '../domain/usuario'

export class IniciarSesion {
  constructor(private readonly repositorio: RepositorioAutenticacion) {}

  ejecutar(correo: string, clave: string): Promise<Usuario | null> {
    return this.repositorio.iniciarSesion(correo.trim().toLowerCase(), clave)
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
