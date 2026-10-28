import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type { DescargarArchivo, ListarActividades, ListarMateriales } from '../application/casosDeUso'
import type { Actividad, Material, TipoContenido } from '../domain/contenido'

export interface CasosDeUsoAula {
  listarMateriales: ListarMateriales
  listarActividades: ListarActividades
  descargarArchivo: DescargarArchivo
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
