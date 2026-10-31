import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type {
  DescargarArchivo,
  EliminarContenido,
  ListarActividades,
  ListarMateriales,
  PublicarActividad,
  PublicarMaterial,
} from '../application/casosDeUso'
import type { Actividad, Material, NuevaActividad, NuevoMaterial, TipoContenido } from '../domain/contenido'

export interface CasosDeUsoAula {
  listarMateriales: ListarMateriales
  listarActividades: ListarActividades
  descargarArchivo: DescargarArchivo
  publicarMaterial: PublicarMaterial
  publicarActividad: PublicarActividad
  eliminarContenido: EliminarContenido
}

const Contexto = createContext<CasosDeUsoAula | null>(null)

export function AulaProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoAula; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoAula {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks del aula requieren AulaProvider')
  return casosDeUso
}

interface Lista<T> {
  items: T[]
  cargando: boolean
  error: boolean
}

/** Las claves incluyen al usuario: al cambiar de cuenta no se reutilizan datos de la anterior. */
export function useMateriales(grupoId: number | undefined): Lista<Material> {
  const { listarMateriales } = useCasosDeUso()
  const { usuario } = useAuth()
  const habilitado = Boolean(usuario) && grupoId !== undefined
  const { data, isPending, isError } = useQuery({
    queryKey: ['materiales', usuario?.id, grupoId],
    queryFn: () => listarMateriales.ejecutar(grupoId as number),
    enabled: habilitado,
  })
  return { items: data ?? [], cargando: habilitado && isPending, error: isError }
}

export function useActividades(grupoId: number | undefined): Lista<Actividad> {
  const { listarActividades } = useCasosDeUso()
  const { usuario } = useAuth()
  const habilitado = Boolean(usuario) && grupoId !== undefined
  const { data, isPending, isError } = useQuery({
    queryKey: ['actividades', usuario?.id, grupoId],
    queryFn: () => listarActividades.ejecutar(grupoId as number),
    enabled: habilitado,
  })
  return { items: data ?? [], cargando: habilitado && isPending, error: isError }
}

/** Descarga el archivo con la sesión del usuario y lo entrega al navegador con su nombre. */
export function useDescargarArchivo() {
  const { descargarArchivo } = useCasosDeUso()
  return useMutation({
    mutationFn: async (datos: { tipo: TipoContenido; grupoId: number; contenidoId: number; nombreSugerido: string }) => {
      const archivo = await descargarArchivo.ejecutar(datos.tipo, datos.grupoId, datos.contenidoId)
      const direccion = URL.createObjectURL(archivo.contenido)
      const enlace = document.createElement('a')
      enlace.href = direccion
      enlace.download = archivo.nombre || datos.nombreSugerido
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      setTimeout(() => URL.revokeObjectURL(direccion), 10_000)
    },
  })
}

/** Tras publicar o eliminar se vuelve a pedir la lista del grupo afectado. */
function useInvalidarGrupo() {
  const cliente = useQueryClient()
  const { usuario } = useAuth()
  return (tipo: TipoContenido, grupoId: number) =>
    cliente.invalidateQueries({ queryKey: [tipo === 'materiales' ? 'materiales' : 'actividades', usuario?.id, grupoId] })
}

export function usePublicarMaterial() {
  const { publicarMaterial } = useCasosDeUso()
  const invalidar = useInvalidarGrupo()
  return useMutation({
    mutationFn: (nuevo: NuevoMaterial) => publicarMaterial.ejecutar(nuevo),
    onSuccess: (_creado, nuevo) => invalidar('materiales', nuevo.grupoId),
  })
}

export function usePublicarActividad() {
  const { publicarActividad } = useCasosDeUso()
  const invalidar = useInvalidarGrupo()
  return useMutation({
    mutationFn: (nueva: NuevaActividad) => publicarActividad.ejecutar(nueva),
    onSuccess: (_creada, nueva) => invalidar('actividades', nueva.grupoId),
  })
}

export function useEliminarContenido() {
  const { eliminarContenido } = useCasosDeUso()
  const invalidar = useInvalidarGrupo()
  return useMutation({
    mutationFn: (datos: { tipo: TipoContenido; grupoId: number; contenidoId: number }) =>
      eliminarContenido.ejecutar(datos.tipo, datos.grupoId, datos.contenidoId),
    onSuccess: (_vacio, datos) => invalidar(datos.tipo, datos.grupoId),
  })
}
