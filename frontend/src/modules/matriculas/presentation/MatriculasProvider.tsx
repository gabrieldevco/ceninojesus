import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EnviarSolicitud, ListarEstudiantes, ListarSolicitudes, ResolverSolicitud } from '../application/casosDeUso'
import type { NuevaSolicitud, SolicitudMatricula } from '../domain/solicitud'

export interface CasosDeUsoMatriculas {
  listarSolicitudes: ListarSolicitudes
  enviarSolicitud: EnviarSolicitud
  resolverSolicitud: ResolverSolicitud
  listarEstudiantes: ListarEstudiantes
}

const Contexto = createContext<CasosDeUsoMatriculas | null>(null)
const CLAVE_SOLICITUDES = ['solicitudes'] as const

export function MatriculasProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoMatriculas; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoMatriculas {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks de matrículas requieren MatriculasProvider')
  return casosDeUso
}

export function useSolicitudes(): { solicitudes: SolicitudMatricula[]; cargando: boolean } {
  const { listarSolicitudes } = useCasosDeUso()
  const { data, isPending } = useQuery({ queryKey: CLAVE_SOLICITUDES, queryFn: () => listarSolicitudes.ejecutar() })
  return { solicitudes: data ?? [], cargando: isPending }
}

export function useEstudiantes(): string[] {
  const { listarEstudiantes } = useCasosDeUso()
  const { data } = useQuery({ queryKey: ['estudiantes'], queryFn: () => listarEstudiantes.ejecutar() })
  return data ?? []
}

export function useEnviarSolicitud() {
  const { enviarSolicitud } = useCasosDeUso()
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (nueva: NuevaSolicitud) => enviarSolicitud.ejecutar(nueva),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVE_SOLICITUDES }),
  })
}

export function useResolverSolicitud() {
  const { resolverSolicitud } = useCasosDeUso()
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (datos: { id: number; motivo?: string }) =>
      datos.motivo === undefined ? resolverSolicitud.aprobar(datos.id) : resolverSolicitud.rechazar(datos.id, datos.motivo),
    onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVE_SOLICITUDES }),
  })
}
