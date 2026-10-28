/** Mismos roles que el backend (`shared/domain/actor.py`); el dominio no importa de otros módulos. */
export type Rol = 'administrador' | 'administrador_grupo' | 'acudiente' | 'estudiante'

export const ROLES_ADMINISTRABLES: readonly Rol[] = ['administrador', 'administrador_grupo', 'acudiente', 'estudiante']

export const ETIQUETA_DE_ROL: Record<Rol, string> = {
  administrador: 'Administrador general',
  administrador_grupo: 'Administrador de grupo',
  acudiente: 'Acudiente',
  estudiante: 'Estudiante',
}

export interface CuentaDeUsuario {
  id: number
  nombreUsuario: string
  rol: Rol
  correo: string
  nombres: string
  apellidos: string
  telefono: string
  activo: boolean
}

export interface NuevaCuenta {
  nombreUsuario: string
  password: string
  rol: Rol
  correo: string
  nombres: string
  apellidos: string
}

export interface CambiosDeCuenta {
  rol?: Rol
  activo?: boolean
}

export interface GrupoAdministrable {
  id: number
  nombre: string
  descripcion: string
  horario: string
  /** Sin límite si es `null` */
  cupoMaximo: number | null
  activo: boolean
  administradorIds: number[]
}

export type DatosDeGrupo = Pick<GrupoAdministrable, 'nombre' | 'descripcion' | 'horario' | 'cupoMaximo' | 'activo'>

export type ErroresDeCampos<T> = Partial<Record<keyof T, string>>

export class DatosInvalidos<T> extends Error {
  constructor(readonly campos: ErroresDeCampos<T>) {
    super(Object.values<string | undefined>(campos)[0] ?? 'Los datos no son válidos')
    this.name = 'DatosInvalidos'
  }
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** La cuenta de un usuario anonimizado (Ley 1581) ya no tiene datos ni acceso y no admite cambios. */
export const estaAnonimizada = (cuenta: Pick<CuentaDeUsuario, 'nombreUsuario'>): boolean =>
  cuenta.nombreUsuario.startsWith('anonimo-')

export function validarNuevaCuenta(datos: NuevaCuenta): NuevaCuenta {
  const campos: ErroresDeCampos<NuevaCuenta> = {}
  if (datos.nombreUsuario.trim().length < 3) campos.nombreUsuario = 'El usuario debe tener al menos 3 caracteres.'
  if (/\s/.test(datos.nombreUsuario.trim())) campos.nombreUsuario = 'El usuario no puede tener espacios.'
  if (datos.password.length < 8) campos.password = 'La contraseña debe tener al menos 8 caracteres.'
  if (datos.correo.trim() && !CORREO.test(datos.correo.trim())) campos.correo = 'Escribe un correo válido.'
  if (Object.keys(campos).length > 0) throw new DatosInvalidos(campos)
  return {
    ...datos,
    nombreUsuario: datos.nombreUsuario.trim(),
    correo: datos.correo.trim(),
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
  }
}

export function validarDatosDeGrupo(datos: DatosDeGrupo): DatosDeGrupo {
  const campos: ErroresDeCampos<DatosDeGrupo> = {}
  if (!datos.nombre.trim()) campos.nombre = 'Escribe el nombre del grupo.'
  if (datos.cupoMaximo !== null && (!Number.isInteger(datos.cupoMaximo) || datos.cupoMaximo < 1)) {
    campos.cupoMaximo = 'El cupo debe ser un número entero mayor que cero, o quedar vacío.'
  }
  if (Object.keys(campos).length > 0) throw new DatosInvalidos(campos)
  return { ...datos, nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim(), horario: datos.horario.trim() }
}

export function contarPorRol(cuentas: readonly CuentaDeUsuario[], rol: Rol): number {
  return cuentas.filter((c) => c.rol === rol && c.activo).length
}
