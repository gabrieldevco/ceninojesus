import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type {
  ListarSolicitudesDeDatos,
  RadicarSolicitudDeDatos,
  ResponderSolicitudDeDatos,
  TramitarSolicitudDeDatos,
} from '../application/casosDeUso'
import type { NuevaSolicitud, SolicitudDeDatos } from '../domain/solicitud'

export interface CasosDeUsoDatosPersonales {
  radicarSolicitud: RadicarSolicitudDeDatos
  listarSolicitudes: ListarSolicitudesDeDatos
  tramitarSolicitud: TramitarSolicitudDeDatos
  responderSolicitud: ResponderSolicitudDeDatos
}

const Contexto = createContext<CasosDeUsoDatosPersonales | null>(null)

export function DatosPersonalesProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoDatosPersonales; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoDatosPersonales {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks de datos personales requieren DatosPersonalesProvider')
  return casosDeUso
}

export function useRadicarSolicitud() {
  const { radicarSolicitud } = useCasosDeUso()
  return useMutation({ mutationFn: (nueva: NuevaSolicitud) => radicarSolicitud.ejecutar(nueva) })
}

/** Las claves incluyen al usuario: al cambiar de cuenta no se reutilizan datos de la anterior. */
function useClaves() {
  const { usuario } = useAuth()
  return { habilitado: Boolean(usuario), solicitudes: ['solicitudes-datos', usuario?.id] as const }
}

export function useSolicitudesDeDatos(): { solicitudes: SolicitudDeDatos[]; cargando: boolean; error: boolean } {
  const { listarSolicitudes } = useCasosDeUso()
  const claves = useClaves()
  const { data, isPending, isError } = useQuery({
    queryKey: claves.solicitudes,
    queryFn: () => listarSolicitudes.ejecutar(),
    enabled: claves.habilitado,
  })
  return { solicitudes: data ?? [], cargando: claves.habilitado && isPending, error: isError }
}

export function useTramitarSolicitud() {
  const { tramitarSolicitud } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (id: number) => tramitarSolicitud.ejecutar(id),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.solicitudes }),
  })
}

export function useResponderSolicitud() {
  const { responderSolicitud } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: { id: number; respuesta: string }) => responderSolicitud.ejecutar(datos.id, datos.respuesta),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.solicitudes }),
  })
}
