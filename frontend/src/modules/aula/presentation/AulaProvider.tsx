import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ListarMateriales } from '../application/listarMateriales'
import type { Material } from '../domain/material'

export interface CasosDeUsoAula {
  listarMateriales: ListarMateriales
}

const Contexto = createContext<CasosDeUsoAula | null>(null)

export function AulaProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoAula; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

export function useMateriales(grupo: string | undefined): Material[] {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('useMateriales requiere AulaProvider')
  const { data } = useQuery({
    queryKey: ['materiales', grupo],
    queryFn: () => casosDeUso.listarMateriales.ejecutar(grupo ?? ''),
    enabled: Boolean(grupo),
  })
  return data ?? []
}
