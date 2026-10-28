import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CerrarSesion, IniciarSesion, ObtenerSesion, SolicitarRecuperacion } from '../application/casosDeUso'
import type { Usuario } from '../domain/usuario'

export interface CasosDeUsoAuth {
  iniciarSesion: IniciarSesion
  obtenerSesion: ObtenerSesion
  cerrarSesion: CerrarSesion
  solicitarRecuperacion: SolicitarRecuperacion
}

interface ContextoAuth {
  usuario: Usuario | null
  /** true mientras se recupera la sesión guardada al abrir la aplicación */
  cargando: boolean
  iniciarSesion: (identificador: string, clave: string) => Promise<Usuario | null>
  cerrarSesion: () => Promise<void>
  solicitarRecuperacion: (identificador: string) => Promise<void>
  /** true cuando la app corre con cuentas de demostración (sin backend) */
  modoDemo: boolean
}

const Contexto = createContext<ContextoAuth | null>(null)

export function AuthProvider({
  casosDeUso,
  modoDemo = false,
  children,
}: {
  casosDeUso: CasosDeUsoAuth
  modoDemo?: boolean
  children: ReactNode
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    void casosDeUso.obtenerSesion.ejecutar().then((u) => {
      if (!activo) return
      setUsuario(u)
      setCargando(false)
    })
    return () => {
      activo = false
    }
  }, [casosDeUso])

  const iniciarSesion = useCallback(
    async (identificador: string, clave: string) => {
      const u = await casosDeUso.iniciarSesion.ejecutar(identificador, clave)
      if (u) setUsuario(u)
      return u
    },
    [casosDeUso],
  )

  const cerrarSesion = useCallback(async () => {
    await casosDeUso.cerrarSesion.ejecutar()
    setUsuario(null)
  }, [casosDeUso])

  const solicitarRecuperacion = useCallback(
    (identificador: string) => casosDeUso.solicitarRecuperacion.ejecutar(identificador),
    [casosDeUso],
  )

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion, solicitarRecuperacion, modoDemo }),
    [usuario, cargando, iniciarSesion, cerrarSesion, solicitarRecuperacion, modoDemo],
  )
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth requiere AuthProvider')
  return contexto
}
