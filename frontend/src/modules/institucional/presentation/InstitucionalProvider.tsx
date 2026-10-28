import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type { EnviarMensajeDeContacto, ListarEnlaces, ObtenerPoliticaDeDatos } from '../application/casosDeUso'
import type {
  ActualizarElemento,
  ActualizarEnlace,
  ActualizarInformacion,
  CrearElemento,
  CrearEnlace,
  EliminarElemento,
  EliminarEnlace,
  ListarElementosDelSitio,
  ListarEnlacesEditables,
  ObtenerContenidoLanding,
  QuitarImagenDeElemento,
  ReemplazarImagenUnica,
  SubirImagenDeElemento,
} from '../application/casosDeUsoSitio'
import type { Enlace, NuevoMensaje, PoliticaDeDatos } from '../domain/contacto'
import { CONTENIDO_POR_DEFECTO } from '../domain/contenidoPorDefecto'
import type {
  CambiosDeElemento,
  ContenidoLanding,
  ElementoLanding,
  InformacionLanding,
  NuevoElemento,
  SeccionDeImagen,
} from '../domain/landing'
import type { EnlaceEditable, NuevoEnlace } from '../domain/sitio'

export interface CasosDeUsoInstitucional {
  enviarMensaje: EnviarMensajeDeContacto
  obtenerPolitica: ObtenerPoliticaDeDatos
  listarEnlaces: ListarEnlaces
  sitio: CasosDeUsoSitio
}

/** Edición del contenido de la página de inicio y de los enlaces del portal (administrador general). */
export interface CasosDeUsoSitio {
  obtenerContenido: ObtenerContenidoLanding
  actualizarInformacion: ActualizarInformacion
  listarElementos: ListarElementosDelSitio
  crearElemento: CrearElemento
  actualizarElemento: ActualizarElemento
  eliminarElemento: EliminarElemento
  subirImagen: SubirImagenDeElemento
  quitarImagen: QuitarImagenDeElemento
  reemplazarImagenUnica: ReemplazarImagenUnica
  listarEnlacesEditables: ListarEnlacesEditables
  crearEnlace: CrearEnlace
  actualizarEnlace: ActualizarEnlace
  eliminarEnlace: EliminarEnlace
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

// --- Contenido de la página de inicio ---

/**
 * Contenido público de la página. Mientras carga, o si el servidor no responde, se muestra el contenido
 * con el que se publicó el sitio: la página nunca queda en blanco.
 */
export function useContenidoLanding(): { contenido: ContenidoLanding; cargando: boolean; esDeRespaldo: boolean } {
  const { sitio } = useCasosDeUso()
  const { data, isPending } = useQuery({
    queryKey: ['landing'],
    queryFn: () => sitio.obtenerContenido.ejecutar(),
    staleTime: 60_000,
  })
  // esDeRespaldo: el editor no debe guardar sobre este contenido, que no es el del servidor
  return { contenido: data ?? CONTENIDO_POR_DEFECTO, cargando: isPending, esDeRespaldo: data === undefined }
}

function useClavesDelSitio() {
  const { usuario } = useAuth()
  return {
    habilitado: Boolean(usuario),
    elementos: ['sitio-elementos', usuario?.id] as const,
    enlaces: ['sitio-enlaces', usuario?.id] as const,
  }
}

/** Tras editar, se refresca lo que ve el público y lo que ve el editor. */
function useAlGuardar() {
  const cliente = useQueryClient()
  const claves = useClavesDelSitio()
  return (...adicionales: ReadonlyArray<readonly unknown[]>) =>
    Promise.all([
      cliente.invalidateQueries({ queryKey: ['landing'] }),
      cliente.invalidateQueries({ queryKey: claves.elementos }),
      ...adicionales.map((queryKey) => cliente.invalidateQueries({ queryKey })),
    ])
}

export function useElementosDelSitio(): { elementos: ElementoLanding[]; cargando: boolean; error: boolean } {
  const { sitio } = useCasosDeUso()
  const claves = useClavesDelSitio()
  const { data, isPending, isError } = useQuery({
    queryKey: claves.elementos,
    queryFn: () => sitio.listarElementos.ejecutar(),
    enabled: claves.habilitado,
  })
  return { elementos: data ?? [], cargando: claves.habilitado && isPending, error: isError }
}

export function useActualizarInformacion() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardar()
  return useMutation({
    mutationFn: (cambios: Partial<InformacionLanding>) => sitio.actualizarInformacion.ejecutar(cambios),
    // La política de datos y el contacto también salen de la información institucional
    onSuccess: () => alGuardar(['politica-datos']),
  })
}

export function useCrearElemento() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardar()
  return useMutation({ mutationFn: (nuevo: NuevoElemento) => sitio.crearElemento.ejecutar(nuevo), onSuccess: () => alGuardar() })
}

export function useActualizarElemento() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardar()
  return useMutation({
    mutationFn: (datos: { elemento: Pick<ElementoLanding, 'id' | 'seccion'>; cambios: CambiosDeElemento }) =>
      sitio.actualizarElemento.ejecutar(datos.elemento, datos.cambios),
    onSuccess: () => alGuardar(),
  })
}

export function useEliminarElemento() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardar()
  return useMutation({ mutationFn: (id: number) => sitio.eliminarElemento.ejecutar(id), onSuccess: () => alGuardar() })
}

export function useSubirImagen() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardar()
  return useMutation({
    mutationFn: (datos: { id: number; archivo: File }) => sitio.subirImagen.ejecutar(datos.id, datos.archivo),
    onSuccess: () => alGuardar(),
  })
}

export function useQuitarImagen() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardar()
  return useMutation({ mutationFn: (id: number) => sitio.quitarImagen.ejecutar(id), onSuccess: () => alGuardar() })
}

export function useReemplazarImagenUnica() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardar()
  return useMutation({
    mutationFn: (datos: { seccion: SeccionDeImagen; archivo: File }) =>
      sitio.reemplazarImagenUnica.ejecutar(datos.seccion, datos.archivo),
    onSuccess: () => alGuardar(),
  })
}

export function useEnlacesEditables(): { enlaces: EnlaceEditable[]; cargando: boolean; error: boolean } {
  const { sitio } = useCasosDeUso()
  const claves = useClavesDelSitio()
  const { data, isPending, isError } = useQuery({
    queryKey: claves.enlaces,
    queryFn: () => sitio.listarEnlacesEditables.ejecutar(),
    enabled: claves.habilitado,
  })
  return { enlaces: data ?? [], cargando: claves.habilitado && isPending, error: isError }
}

/** Al editar enlaces se refresca también el menú del portal (biblioteca). */
function useAlGuardarEnlace() {
  const cliente = useQueryClient()
  const claves = useClavesDelSitio()
  return () =>
    Promise.all([
      cliente.invalidateQueries({ queryKey: claves.enlaces }),
      cliente.invalidateQueries({ queryKey: ['enlaces'] }),
    ])
}

export function useCrearEnlace() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardarEnlace()
  return useMutation({ mutationFn: (nuevo: NuevoEnlace) => sitio.crearEnlace.ejecutar(nuevo), onSuccess: alGuardar })
}

export function useActualizarEnlace() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardarEnlace()
  return useMutation({
    mutationFn: (datos: { id: number; cambios: Partial<NuevoEnlace> }) => sitio.actualizarEnlace.ejecutar(datos.id, datos.cambios),
    onSuccess: alGuardar,
  })
}

export function useEliminarEnlace() {
  const { sitio } = useCasosDeUso()
  const alGuardar = useAlGuardarEnlace()
  return useMutation({ mutationFn: (id: number) => sitio.eliminarEnlace.ejecutar(id), onSuccess: alGuardar })
}
