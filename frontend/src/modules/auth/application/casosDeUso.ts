import type { RepositorioAutenticacion } from '../domain/puertos'
import {
  validarNuevoAcudiente,
  validarRestablecimiento,
  type NuevoAcudiente,
  type RestablecimientoDeClave,
} from '../domain/registro'
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

/** RF-06 / RF-07: los padres y acudientes crean su propia cuenta para solicitar matrículas. */
export class RegistrarAcudiente {
  constructor(private readonly repositorio: RepositorioAutenticacion) {}

  async ejecutar(nuevo: NuevoAcudiente): Promise<void> {
    await this.repositorio.registrarAcudiente(validarNuevoAcudiente(nuevo))
  }
}

export class RestablecerClave {
  constructor(private readonly repositorio: RepositorioAutenticacion) {}

  async ejecutar(datos: RestablecimientoDeClave): Promise<void> {
    await this.repositorio.restablecerClave(validarRestablecimiento(datos))
  }
}
