import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type { EnviarMensajeDeContacto, ListarEnlaces, ObtenerPoliticaDeDatos } from '../application/casosDeUso'
import type { Enlace, NuevoMensaje, PoliticaDeDatos } from '../domain/contacto'

export interface CasosDeUsoInstitucional {
  enviarMensaje: EnviarMensajeDeContacto
  obtenerPolitica: ObtenerPoliticaDeDatos
  listarEnlaces: ListarEnlaces
}

const Contexto = createContext<CasosDeUsoInstitucional | null>(null)

export function InstitucionalProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoInstitucional; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoInstitucional {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks institucionales requieren InstitucionalProvider')
  return casosDeUso
}

export function useEnviarMensaje() {
  const { enviarMensaje } = useCasosDeUso()
  return useMutation({ mutationFn: (nuevo: NuevoMensaje) => enviarMensaje.ejecutar(nuevo) })
}

export function usePoliticaDeDatos(): { politica: PoliticaDeDatos | undefined; cargando: boolean; error: boolean } {
  const { obtenerPolitica } = useCasosDeUso()
  const { data, isPending, isError } = useQuery({
    queryKey: ['politica-datos'],
    queryFn: () => obtenerPolitica.ejecutar(),
    staleTime: 5 * 60_000,
  })
  return { politica: data, cargando: isPending, error: isError }
}

/** Enlaces que administra la institución. La clave incluye al usuario: los enlaces restringidos dependen de la sesión. */
export function useEnlaces(): { enlaces: Enlace[]; cargando: boolean } {
  const { listarEnlaces } = useCasosDeUso()
  const { usuario } = useAuth()
  const habilitado = Boolean(usuario)
  const { data, isPending } = useQuery({
    queryKey: ['enlaces', usuario?.id],
    queryFn: () => listarEnlaces.ejecutar(),
    enabled: habilitado,
    staleTime: 5 * 60_000,
  })
  return { enlaces: data ?? [], cargando: habilitado && isPending }
}
