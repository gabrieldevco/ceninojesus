import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ListarGrupos } from '../application/listarGrupos'
import type { Grupo } from '../domain/grupo'

export interface CasosDeUsoGrupos {
  listarGrupos: ListarGrupos
}

const Contexto = createContext<CasosDeUsoGrupos | null>(null)

export function GruposProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoGrupos; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

export function useGrupos(): { grupos: Grupo[]; cargando: boolean } {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('useGrupos requiere GruposProvider')
  const { data, isPending } = useQuery({ queryKey: ['grupos'], queryFn: () => casosDeUso.listarGrupos.ejecutar() })
  return { grupos: data ?? [], cargando: isPending }
}
