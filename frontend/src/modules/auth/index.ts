import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import { CerrarSesion, IniciarSesion, ObtenerSesion } from './application/casosDeUso'
import { RepositorioAutenticacionDemo } from './infrastructure/RepositorioAutenticacionDemo'
import type { CasosDeUsoAuth } from './presentation/AuthProvider'

export type { Rol, Usuario } from './domain/usuario'
export { puedeAcceder } from './domain/usuario'
export { AuthProvider, useAuth } from './presentation/AuthProvider'
export { default as AccesoPage } from './presentation/AccesoPage'

export function crearCasosDeUsoAuth(almacenamiento: Almacenamiento): CasosDeUsoAuth {
  const repositorio = new RepositorioAutenticacionDemo(almacenamiento)
  return {
    iniciarSesion: new IniciarSesion(repositorio),
    obtenerSesion: new ObtenerSesion(repositorio),
    cerrarSesion: new CerrarSesion(repositorio),
  }
}
