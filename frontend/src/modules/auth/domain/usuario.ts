export type Rol = 'padre' | 'estudiante' | 'admin'

export interface Usuario {
  correo: string
  nombre: string
  rol: Rol
  /** Texto con el que se muestra el perfil en el portal */
  etiqueta: string
  /** Ruta a la que se envía al usuario al iniciar sesión */
  inicio: string
}

export function puedeAcceder(usuario: Usuario, rolesPermitidos: readonly Rol[]): boolean {
  return rolesPermitidos.includes(usuario.rol)
}
