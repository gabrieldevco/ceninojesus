import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CerrarSesion, IniciarSesion, ObtenerSesion } from '../application/casosDeUso'
import type { Usuario } from '../domain/usuario'

export interface CasosDeUsoAuth {
  iniciarSesion: IniciarSesion
  obtenerSesion: ObtenerSesion
  cerrarSesion: CerrarSesion
}

interface ContextoAuth {
  usuario: Usuario | null
  /** true mientras se recupera la sesión guardada al abrir la aplicación */
  cargando: boolean
  iniciarSesion: (correo: string, clave: string) => Promise<Usuario | null>
  cerrarSesion: () => Promise<void>
}

const Contexto = createContext<ContextoAuth | null>(null)

export function AuthProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoAuth; children: ReactNode }) {
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
    async (correo: string, clave: string) => {
      const u = await casosDeUso.iniciarSesion.ejecutar(correo, clave)
      if (u) setUsuario(u)
      return u
    },
    [casosDeUso],
  )

  const cerrarSesion = useCallback(async () => {
    await casosDeUso.cerrarSesion.ejecutar()
    setUsuario(null)
  }, [casosDeUso])

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth requiere AuthProvider')
  return contexto
}
