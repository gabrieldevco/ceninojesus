/** Mismos roles que el backend (`shared/domain/actor.py`). */
export type Rol = 'administrador' | 'administrador_grupo' | 'acudiente' | 'estudiante'

export interface Usuario {
  id: number
  /** Nombre de usuario con el que inicia sesión */
  identificador: string
  nombre: string
  rol: Rol
  /** Texto con el que se muestra el perfil en el portal */
  etiqueta: string
  /** Ruta a la que se envía al usuario al iniciar sesión */
  inicio: string
}

const ETIQUETAS: Record<Rol, string> = {
  administrador: 'Administrador general',
  administrador_grupo: 'Administrador de grupo',
  acudiente: 'Padre / acudiente',
  estudiante: 'Estudiante',
}

const RUTAS_DE_INICIO: Record<Rol, string> = {
  administrador: '/admin/solicitudes',
  administrador_grupo: '/admin/solicitudes',
  acudiente: '/familias/matricula',
  estudiante: '/estudiante/aula',
}

export const ROLES: readonly Rol[] = ['administrador', 'administrador_grupo', 'acudiente', 'estudiante']

export function esRol(valor: string): valor is Rol {
  return (ROLES as readonly string[]).includes(valor)
}

export interface DatosDeUsuario {
  id: number
  identificador: string
  nombres: string
  apellidos: string
  rol: Rol
}

export function crearUsuario(datos: DatosDeUsuario): Usuario {
  const nombre = `${datos.nombres} ${datos.apellidos}`.trim()
  return {
    id: datos.id,
    identificador: datos.identificador,
    nombre: nombre || datos.identificador,
    rol: datos.rol,
    etiqueta: ETIQUETAS[datos.rol],
    inicio: RUTAS_DE_INICIO[datos.rol],
  }
}

export function puedeAcceder(usuario: Usuario, rolesPermitidos: readonly Rol[]): boolean {
  return rolesPermitidos.includes(usuario.rol)
}
