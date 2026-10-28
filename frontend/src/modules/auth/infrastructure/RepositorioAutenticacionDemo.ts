import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import type { RepositorioAutenticacion } from '../domain/puertos'
import { crearUsuario, type Rol, type Usuario } from '../domain/usuario'

export const CLAVE_DEMO = 'demo1234'
const CLAVE_SESION = 'nj_user'

/** Cuentas de demostración por rol: identificador -> datos. */
export const CUENTAS_DEMO: Record<string, { id: number; rol: Rol; nombres: string; apellidos: string }> = {
  padre: { id: 1, rol: 'acudiente', nombres: 'Acudiente demo', apellidos: 'A' },
  estudiante: { id: 2, rol: 'estudiante', nombres: 'Estudiante demo', apellidos: 'A' },
  admin: { id: 3, rol: 'administrador_grupo', nombres: 'Admin', apellidos: 'Robótica' },
}

function usuarioDemo(identificador: string): Usuario | null {
  const cuenta = CUENTAS_DEMO[identificador]
  return cuenta ? crearUsuario({ ...cuenta, identificador }) : null
}

/** Autenticación de demostración (sin backend); se activa con VITE_MODO_DEMO=true. */
export class RepositorioAutenticacionDemo implements RepositorioAutenticacion {
  constructor(private readonly almacenamiento: Almacenamiento) {}

  iniciarSesion(identificador: string, clave: string): Promise<Usuario | null> {
    const usuario = clave === CLAVE_DEMO ? usuarioDemo(identificador) : null
    if (usuario) this.almacenamiento.guardar(CLAVE_SESION, identificador)
    return Promise.resolve(usuario)
  }

  obtenerSesion(): Promise<Usuario | null> {
    const identificador = this.almacenamiento.leer<string>(CLAVE_SESION)
    return Promise.resolve(identificador ? usuarioDemo(identificador) : null)
  }

  cerrarSesion(): Promise<void> {
    this.almacenamiento.borrar(CLAVE_SESION)
    return Promise.resolve()
  }

  solicitarRecuperacion(): Promise<void> {
    return Promise.resolve()
  }
}
