import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import type { RepositorioAutenticacion } from '../domain/puertos'
import type { Usuario } from '../domain/usuario'

export const CLAVE_DEMO = 'demo1234'
const CLAVE_SESION = 'nj_user'

const USUARIOS_DEMO: Record<string, Usuario> = {
  'padre@demo.com': {
    correo: 'padre@demo.com',
    rol: 'padre',
    nombre: 'Acudiente demo A',
    etiqueta: 'Padre / acudiente',
    inicio: '/familias/matricula',
  },
  'estudiante@demo.com': {
    correo: 'estudiante@demo.com',
    rol: 'estudiante',
    nombre: 'Estudiante demo A',
    etiqueta: 'Estudiante',
    inicio: '/estudiante/aula',
  },
  'admin@demo.com': {
    correo: 'admin@demo.com',
    rol: 'admin',
    nombre: 'Admin Robótica',
    etiqueta: 'Administrador de grupo',
    inicio: '/admin/solicitudes',
  },
}

/** Autenticación de demostración; se reemplaza por el repositorio HTTP (JWT) al conectar la API. */
export class RepositorioAutenticacionDemo implements RepositorioAutenticacion {
  constructor(private readonly almacenamiento: Almacenamiento) {}

  iniciarSesion(correo: string, clave: string): Promise<Usuario | null> {
    const usuario = USUARIOS_DEMO[correo]
    if (!usuario || clave !== CLAVE_DEMO) return Promise.resolve(null)
    this.almacenamiento.guardar(CLAVE_SESION, correo)
    return Promise.resolve(usuario)
  }

  obtenerSesion(): Promise<Usuario | null> {
    const correo = this.almacenamiento.leer<string>(CLAVE_SESION)
    return Promise.resolve((correo && USUARIOS_DEMO[correo]) || null)
  }

  cerrarSesion(): Promise<void> {
    this.almacenamiento.borrar(CLAVE_SESION)
    return Promise.resolve()
  }
}
