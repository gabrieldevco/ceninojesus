import type { CambiosDeCuenta, CuentaDeUsuario, DatosDeGrupo, GrupoAdministrable, NuevaCuenta } from '../domain/administracion'
import type { RepositorioAdministracion } from '../domain/puertos'

const cuenta = (id: number, nombreUsuario: string, rol: CuentaDeUsuario['rol'], nombres: string, apellidos: string): CuentaDeUsuario => ({
  id,
  nombreUsuario,
  rol,
  correo: `${nombreUsuario}@example.com`,
  nombres,
  apellidos,
  telefono: '',
  activo: true,
})

/** Cuentas y grupos de demostración, en memoria (modo sin backend). */
export class RepositorioAdministracionDemo implements RepositorioAdministracion {
  private siguienteId = 100
  private usuarios: CuentaDeUsuario[] = [
    cuenta(4, 'general', 'administrador', 'Administrador', 'General'),
    cuenta(3, 'admin', 'administrador_grupo', 'Admin', 'Robótica'),
    cuenta(1, 'padre', 'acudiente', 'Padre', 'Demo'),
    cuenta(2, 'estudiante', 'estudiante', 'Estudiante', 'Demo'),
  ]

  private grupos: GrupoAdministrable[] = [
    { id: 1, nombre: 'Ajedrez', descripcion: 'Estrategia y concentración.', horario: 'Martes 3:00 p. m.', cupoMaximo: 20, activo: true, administradorIds: [3] },
    { id: 2, nombre: 'Robótica', descripcion: '', horario: '', cupoMaximo: null, activo: false, administradorIds: [] },
  ]

  listarUsuarios(): Promise<CuentaDeUsuario[]> {
    return Promise.resolve(this.usuarios.map((u) => ({ ...u })))
  }

  crearUsuario(nueva: NuevaCuenta): Promise<CuentaDeUsuario> {
    if (this.usuarios.some((u) => u.nombreUsuario === nueva.nombreUsuario)) {
      return Promise.reject(new Error('Ya existe un usuario con ese nombre.'))
    }
    const creada: CuentaDeUsuario = {
      id: this.siguienteId++,
      nombreUsuario: nueva.nombreUsuario,
      rol: nueva.rol,
      correo: nueva.correo,
      nombres: nueva.nombres,
      apellidos: nueva.apellidos,
      telefono: '',
      activo: true,
    }
    this.usuarios = [...this.usuarios, creada]
    return Promise.resolve({ ...creada })
  }

  actualizarUsuario(id: number, cambios: CambiosDeCuenta): Promise<CuentaDeUsuario> {
    return this.cambiarUsuario(id, (u) => ({ ...u, ...cambios }))
  }

  anonimizarUsuario(id: number): Promise<CuentaDeUsuario> {
    return this.cambiarUsuario(id, (u) => ({
      ...u,
      nombreUsuario: `anonimo-${u.id}`,
      correo: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      activo: false,
    }))
  }

  listarGrupos(): Promise<GrupoAdministrable[]> {
    return Promise.resolve(this.grupos.map((g) => ({ ...g, administradorIds: [...g.administradorIds] })))
  }

  crearGrupo(datos: DatosDeGrupo): Promise<GrupoAdministrable> {
    const creado: GrupoAdministrable = { id: this.siguienteId++, ...datos, administradorIds: [] }
    this.grupos = [...this.grupos, creado]
    return Promise.resolve({ ...creado })
  }

  actualizarGrupo(id: number, datos: Partial<DatosDeGrupo>): Promise<GrupoAdministrable> {
    return this.cambiarGrupo(id, (g) => ({ ...g, ...datos }))
  }

  asignarAdministradores(grupoId: number, administradorIds: number[]): Promise<GrupoAdministrable> {
    return this.cambiarGrupo(grupoId, (g) => ({ ...g, administradorIds }))
  }

  private cambiarUsuario(id: number, cambio: (u: CuentaDeUsuario) => CuentaDeUsuario): Promise<CuentaDeUsuario> {
    const actual = this.usuarios.find((u) => u.id === id)
    if (!actual) return Promise.reject(new Error('Usuario no encontrado.'))
    const nuevo = cambio(actual)
    this.usuarios = this.usuarios.map((u) => (u.id === id ? nuevo : u))
    return Promise.resolve({ ...nuevo })
  }

  private cambiarGrupo(id: number, cambio: (g: GrupoAdministrable) => GrupoAdministrable): Promise<GrupoAdministrable> {
    const actual = this.grupos.find((g) => g.id === id)
    if (!actual) return Promise.reject(new Error('Grupo no encontrado.'))
    const nuevo = cambio(actual)
    this.grupos = this.grupos.map((g) => (g.id === id ? nuevo : g))
    return Promise.resolve({ ...nuevo })
  }
}
