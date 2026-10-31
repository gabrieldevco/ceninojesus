import type { CambiosDeCuenta, CuentaDeUsuario, DatosDeGrupo, GrupoAdministrable, NuevaCuenta } from './administracion'

/** RF-20: lo que el administrador general puede hacer con cuentas y grupos. */
export interface RepositorioAdministracion {
  listarUsuarios(): Promise<CuentaDeUsuario[]>
  crearUsuario(nueva: NuevaCuenta): Promise<CuentaDeUsuario>
  actualizarUsuario(id: number, cambios: CambiosDeCuenta): Promise<CuentaDeUsuario>
  /** Ley 1581, supresión: borra los datos personales del usuario (y de sus estudiantes) y le quita el acceso. */
  anonimizarUsuario(id: number): Promise<CuentaDeUsuario>
  /** Incluye los grupos inactivos. */
  listarGrupos(): Promise<GrupoAdministrable[]>
  crearGrupo(datos: DatosDeGrupo): Promise<GrupoAdministrable>
  actualizarGrupo(id: number, datos: Partial<DatosDeGrupo>): Promise<GrupoAdministrable>
  asignarAdministradores(grupoId: number, administradorIds: number[]): Promise<GrupoAdministrable>
}
