import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type { EnviarSolicitud, ListarEstudiantes, ListarSolicitudes, ResolverSolicitud } from '../application/casosDeUso'
import type { EstudianteVinculado, NuevaSolicitud, SolicitudMatricula } from '../domain/solicitud'

export interface CasosDeUsoMatriculas {
  listarSolicitudes: ListarSolicitudes
  enviarSolicitud: EnviarSolicitud
  resolverSolicitud: ResolverSolicitud
  listarEstudiantes: ListarEstudiantes
}

const Contexto = createContext<CasosDeUsoMatriculas | null>(null)

export function MatriculasProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoMatriculas; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoMatriculas {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks de matrículas requieren MatriculasProvider')
  return casosDeUso
}

/** Las claves incluyen al usuario: al cambiar de cuenta no se reutilizan datos de la anterior. */
function useClaves() {
  const { usuario } = useAuth()
  return {
    habilitado: Boolean(usuario),
    solicitudes: ['solicitudes', usuario?.id] as const,
    estudiantes: ['estudiantes', usuario?.id] as const,
  }
}

export function useSolicitudes(): { solicitudes: SolicitudMatricula[]; cargando: boolean } {
  const { listarSolicitudes } = useCasosDeUso()
  const claves = useClaves()
  const { data, isPending } = useQuery({
    queryKey: claves.solicitudes,
    queryFn: () => listarSolicitudes.ejecutar(),
    enabled: claves.habilitado,
  })
  return { solicitudes: data ?? [], cargando: claves.habilitado && isPending }
}

export function useEstudiantes(): { estudiantes: EstudianteVinculado[]; cargando: boolean } {
  const { listarEstudiantes } = useCasosDeUso()
  const claves = useClaves()
  const { data, isPending } = useQuery({
    queryKey: claves.estudiantes,
    queryFn: () => listarEstudiantes.ejecutar(),
    enabled: claves.habilitado,
  })
  return { estudiantes: data ?? [], cargando: claves.habilitado && isPending }
}

export function useEnviarSolicitud() {
  const { enviarSolicitud } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (nueva: NuevaSolicitud) => enviarSolicitud.ejecutar(nueva),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.solicitudes }),
  })
}

export function useResolverSolicitud() {
  const { resolverSolicitud } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: { id: number; motivo?: string }) =>
      datos.motivo === undefined ? resolverSolicitud.aprobar(datos.id) : resolverSolicitud.rechazar(datos.id, datos.motivo),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.solicitudes }),
  })
}
