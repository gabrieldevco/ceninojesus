import {
  validarDatosDeGrupo,
  validarNuevaCuenta,
  type CambiosDeCuenta,
  type CuentaDeUsuario,
  type DatosDeGrupo,
  type GrupoAdministrable,
  type NuevaCuenta,
} from '../domain/administracion'
import type { RepositorioAdministracion } from '../domain/puertos'

export class ListarUsuarios {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  ejecutar(): Promise<CuentaDeUsuario[]> {
    return this.repositorio.listarUsuarios()
  }
}

/** El administrador crea cuentas con cualquier rol (personal del colegio, por ejemplo). */
export class CrearUsuario {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  async ejecutar(nueva: NuevaCuenta): Promise<CuentaDeUsuario> {
    return this.repositorio.crearUsuario(validarNuevaCuenta(nueva))
  }
}

export class ActualizarUsuario {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  ejecutar(id: number, cambios: CambiosDeCuenta): Promise<CuentaDeUsuario> {
    return this.repositorio.actualizarUsuario(id, cambios)
  }
}

export class AnonimizarUsuario {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  ejecutar(id: number): Promise<CuentaDeUsuario> {
    return this.repositorio.anonimizarUsuario(id)
  }
}

export class ListarGruposAdministrables {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  ejecutar(): Promise<GrupoAdministrable[]> {
    return this.repositorio.listarGrupos()
  }
}

export class CrearGrupo {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  async ejecutar(datos: DatosDeGrupo): Promise<GrupoAdministrable> {
    return this.repositorio.crearGrupo(validarDatosDeGrupo(datos))
  }
}

export class ActualizarGrupo {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  async ejecutar(grupo: GrupoAdministrable, datos: DatosDeGrupo): Promise<GrupoAdministrable> {
    return this.repositorio.actualizarGrupo(grupo.id, validarDatosDeGrupo(datos))
  }
}

export class AsignarAdministradores {
  constructor(private readonly repositorio: RepositorioAdministracion) {}

  ejecutar(grupoId: number, administradorIds: number[]): Promise<GrupoAdministrable> {
    return this.repositorio.asignarAdministradores(grupoId, [...new Set(administradorIds)])
  }
}
