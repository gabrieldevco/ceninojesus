import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type {
  CambiarEstadoInteresado,
  ListarInteresados,
  ListarSeguimientos,
  RegistrarInteresado,
  RegistrarSeguimiento,
} from '../application/casosDeUso'
import type { EstadoInteresado, Interesado, NuevoInteresado, Seguimiento } from '../domain/interesado'

export interface CasosDeUsoInteresados {
  registrarInteresado: RegistrarInteresado
  listarInteresados: ListarInteresados
  cambiarEstadoInteresado: CambiarEstadoInteresado
  listarSeguimientos: ListarSeguimientos
  registrarSeguimiento: RegistrarSeguimiento
}

const Contexto = createContext<CasosDeUsoInteresados | null>(null)

export function InteresadosProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoInteresados; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoInteresados {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks de interesados requieren InteresadosProvider')
  return casosDeUso
}

export function useRegistrarInteresado() {
  const { registrarInteresado } = useCasosDeUso()
  return useMutation({ mutationFn: (nuevo: NuevoInteresado) => registrarInteresado.ejecutar(nuevo) })
}

/** Las claves incluyen al usuario: al cambiar de cuenta no se reutilizan datos de la anterior. */
function useClaves() {
  const { usuario } = useAuth()
  return {
    habilitado: Boolean(usuario),
    interesados: ['interesados', usuario?.id] as const,
    seguimientos: (id: number | undefined) => ['seguimientos', usuario?.id, id] as const,
  }
}

export function useInteresados(): { interesados: Interesado[]; cargando: boolean; error: boolean } {
  const { listarInteresados } = useCasosDeUso()
  const claves = useClaves()
  const { data, isPending, isError } = useQuery({
    queryKey: claves.interesados,
    queryFn: () => listarInteresados.ejecutar(),
    enabled: claves.habilitado,
  })
  return { interesados: data ?? [], cargando: claves.habilitado && isPending, error: isError }
}

export function useSeguimientos(interesadoId: number | undefined): { seguimientos: Seguimiento[]; cargando: boolean } {
  const { listarSeguimientos } = useCasosDeUso()
  const claves = useClaves()
  const habilitado = claves.habilitado && interesadoId !== undefined
  const { data, isPending } = useQuery({
    queryKey: claves.seguimientos(interesadoId),
    queryFn: () => listarSeguimientos.ejecutar(interesadoId as number),
    enabled: habilitado,
  })
  return { seguimientos: data ?? [], cargando: habilitado && isPending }
}

export function useCambiarEstado() {
  const { cambiarEstadoInteresado } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: { interesado: Pick<Interesado, 'id' | 'estado'>; estado: EstadoInteresado }) =>
      cambiarEstadoInteresado.ejecutar(datos.interesado, datos.estado),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.interesados }),
  })
}

export function useRegistrarSeguimiento() {
  const { registrarSeguimiento } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: { interesadoId: number; nota: string }) => registrarSeguimiento.ejecutar(datos.interesadoId, datos.nota),
    onSuccess: (_creado, datos) =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: claves.seguimientos(datos.interesadoId) }),
        // Registrar un contacto puede pasar al interesado de "nuevo" a "en seguimiento"
        cliente.invalidateQueries({ queryKey: claves.interesados }),
      ]),
  })
}
