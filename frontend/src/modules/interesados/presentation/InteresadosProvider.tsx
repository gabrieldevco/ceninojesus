import { createContext, useContext, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { RegistrarInteresado } from '../application/casosDeUso'
import type { NuevoInteresado } from '../domain/interesado'

export interface CasosDeUsoInteresados {
  registrarInteresado: RegistrarInteresado
}

const Contexto = createContext<CasosDeUsoInteresados | null>(null)

export function InteresadosProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoInteresados; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

export function useRegistrarInteresado() {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('useRegistrarInteresado requiere InteresadosProvider')
  return useMutation({ mutationFn: (nuevo: NuevoInteresado) => casosDeUso.registrarInteresado.ejecutar(nuevo) })
}
