import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type { ListarGrupos, ListarMisGrupos } from '../application/casosDeUso'
import type { Grupo } from '../domain/grupo'

export interface CasosDeUsoGrupos {
  listarGrupos: ListarGrupos
  listarMisGrupos: ListarMisGrupos
}

const Contexto = createContext<CasosDeUsoGrupos | null>(null)

export function GruposProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoGrupos; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoGrupos {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks de grupos requieren GruposProvider')
  return casosDeUso
}

/** Grupos activos (públicos). */
export function useGrupos(): { grupos: Grupo[]; cargando: boolean } {
  const { listarGrupos } = useCasosDeUso()
  const { data, isPending } = useQuery({ queryKey: ['grupos'], queryFn: () => listarGrupos.ejecutar() })
  return { grupos: data ?? [], cargando: isPending }
}

/** Grupos del usuario con sesión. La clave incluye al usuario para no mezclar datos al cambiar de cuenta. */
export function useMisGrupos(): { grupos: Grupo[]; cargando: boolean } {
  const { listarMisGrupos } = useCasosDeUso()
  const { usuario } = useAuth()
  const { data, isPending } = useQuery({
    queryKey: ['mis-grupos', usuario?.id],
    queryFn: () => listarMisGrupos.ejecutar(),
    enabled: Boolean(usuario),
  })
  return { grupos: data ?? [], cargando: Boolean(usuario) && isPending }
}

const ICONOS = ['♞', '⚙', '✺', '♪', '★', '✎']
const ICONOS_POR_NOMBRE: Record<string, string> = { Ajedrez: '♞', Robótica: '⚙', 'Danza y arte': '✺', Música: '♪' }

/** La API no guarda un icono por grupo: se usa uno conocido por nombre o uno de la lista según el orden. */
export function iconoDeGrupo(nombre: string, indice: number): string {
  return ICONOS_POR_NOMBRE[nombre] ?? ICONOS[indice % ICONOS.length] ?? '★'
}
