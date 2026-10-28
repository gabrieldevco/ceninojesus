import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type { ListarEstudiantes, RegistrarEstudiante } from '../application/casosDeUso'
import type { Estudiante, NuevoEstudiante } from '../domain/estudiante'

export interface CasosDeUsoEstudiantes {
  listarEstudiantes: ListarEstudiantes
  registrarEstudiante: RegistrarEstudiante
}

const Contexto = createContext<CasosDeUsoEstudiantes | null>(null)

export function EstudiantesProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoEstudiantes; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoEstudiantes {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks de estudiantes requieren EstudiantesProvider')
  return casosDeUso
}

/** La clave incluye al usuario: al cambiar de cuenta no se reutilizan datos de la anterior. */
function useClave() {
  const { usuario } = useAuth()
  return { habilitado: Boolean(usuario), clave: ['estudiantes', usuario?.id] as const }
}

export function useEstudiantes(): { estudiantes: Estudiante[]; cargando: boolean } {
  const { listarEstudiantes } = useCasosDeUso()
  const { habilitado, clave } = useClave()
  const { data, isPending } = useQuery({ queryKey: clave, queryFn: () => listarEstudiantes.ejecutar(), enabled: habilitado })
  return { estudiantes: data ?? [], cargando: habilitado && isPending }
}

export function useRegistrarEstudiante() {
  const { registrarEstudiante } = useCasosDeUso()
  const cliente = useQueryClient()
  const { clave } = useClave()
  return useMutation({
    mutationFn: (nuevo: NuevoEstudiante) => registrarEstudiante.ejecutar(nuevo),
    onSuccess: () => cliente.invalidateQueries({ queryKey: clave }),
  })
}
