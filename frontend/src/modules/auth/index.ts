import { lazy } from 'react'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import {
  CerrarSesion,
  IniciarSesion,
  ObtenerSesion,
  RegistrarAcudiente,
  RestablecerClave,
  SolicitarRecuperacion,
} from './application/casosDeUso'
import type { RepositorioAutenticacion } from './domain/puertos'
import { GestorDeSesion } from './infrastructure/GestorDeSesion'
import { RepositorioAutenticacionDemo } from './infrastructure/RepositorioAutenticacionDemo'
import { RepositorioAutenticacionHttp } from './infrastructure/RepositorioAutenticacionHttp'
import type { CasosDeUsoAuth } from './presentation/AuthProvider'

export type { Rol, Usuario } from './domain/usuario'
export { puedeAcceder } from './domain/usuario'
export { DemasiadosIntentos } from './domain/puertos'
export { AuthProvider, useAuth } from './presentation/AuthProvider'
// Las páginas se cargan al visitar su ruta: no pesan en la carga inicial del sitio
export const AccesoPage = lazy(() => import('./presentation/AccesoPage'))
export const RegistroPage = lazy(() => import('./presentation/RegistroPage'))
export const RestablecerClavePage = lazy(() => import('./presentation/RestablecerClavePage'))

/** Crea el gestor de sesión que el cliente HTTP usa para enviar y renovar el token. */
export function crearGestorDeSesion(almacenamiento: Almacenamiento, http: HttpClient): GestorDeSesion {
  return new GestorDeSesion(almacenamiento, http)
}
export type { GestorDeSesion }

export interface DependenciasAuth {
  almacenamiento: Almacenamiento
  http: HttpClient
  sesion: GestorDeSesion
  modoDemo: boolean
}

export function crearCasosDeUsoAuth({ almacenamiento, http, sesion, modoDemo }: DependenciasAuth): CasosDeUsoAuth {
  const repositorio: RepositorioAutenticacion = modoDemo
    ? new RepositorioAutenticacionDemo(almacenamiento)
    : new RepositorioAutenticacionHttp(http, sesion)
  return {
    iniciarSesion: new IniciarSesion(repositorio),
    obtenerSesion: new ObtenerSesion(repositorio),
    cerrarSesion: new CerrarSesion(repositorio),
    solicitarRecuperacion: new SolicitarRecuperacion(repositorio),
    registrarAcudiente: new RegistrarAcudiente(repositorio),
    restablecerClave: new RestablecerClave(repositorio),
  }
}
