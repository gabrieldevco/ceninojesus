import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth'
import type {
  ActualizarGrupo,
  ActualizarUsuario,
  AnonimizarUsuario,
  AsignarAdministradores,
  CrearGrupo,
  CrearUsuario,
  ListarGruposAdministrables,
  ListarUsuarios,
} from '../application/casosDeUso'
import type { CambiosDeCuenta, CuentaDeUsuario, DatosDeGrupo, GrupoAdministrable, NuevaCuenta } from '../domain/administracion'

export interface CasosDeUsoAdministracion {
  listarUsuarios: ListarUsuarios
  crearUsuario: CrearUsuario
  actualizarUsuario: ActualizarUsuario
  anonimizarUsuario: AnonimizarUsuario
  listarGrupos: ListarGruposAdministrables
  crearGrupo: CrearGrupo
  actualizarGrupo: ActualizarGrupo
  asignarAdministradores: AsignarAdministradores
}

const Contexto = createContext<CasosDeUsoAdministracion | null>(null)

export function AdministracionProvider({ casosDeUso, children }: { casosDeUso: CasosDeUsoAdministracion; children: ReactNode }) {
  return <Contexto.Provider value={casosDeUso}>{children}</Contexto.Provider>
}

function useCasosDeUso(): CasosDeUsoAdministracion {
  const casosDeUso = useContext(Contexto)
  if (!casosDeUso) throw new Error('Los hooks de administración requieren AdministracionProvider')
  return casosDeUso
}

/** Las claves incluyen al usuario: al cambiar de cuenta no se reutilizan datos de la anterior. */
function useClaves() {
  const { usuario } = useAuth()
  return {
    habilitado: Boolean(usuario),
    usuarios: ['admin-usuarios', usuario?.id] as const,
    grupos: ['admin-grupos', usuario?.id] as const,
  }
}

export function useUsuarios(): { usuarios: CuentaDeUsuario[]; cargando: boolean; error: boolean } {
  const { listarUsuarios } = useCasosDeUso()
  const claves = useClaves()
  const { data, isPending, isError } = useQuery({
    queryKey: claves.usuarios,
    queryFn: () => listarUsuarios.ejecutar(),
    enabled: claves.habilitado,
  })
  return { usuarios: data ?? [], cargando: claves.habilitado && isPending, error: isError }
}

export function useGruposAdministrables(): { grupos: GrupoAdministrable[]; cargando: boolean; error: boolean } {
  const { listarGrupos } = useCasosDeUso()
  const claves = useClaves()
  const { data, isPending, isError } = useQuery({
    queryKey: claves.grupos,
    queryFn: () => listarGrupos.ejecutar(),
    enabled: claves.habilitado,
  })
  return { grupos: data ?? [], cargando: claves.habilitado && isPending, error: isError }
}

export function useCrearUsuario() {
  const { crearUsuario } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (nueva: NuevaCuenta) => crearUsuario.ejecutar(nueva),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.usuarios }),
  })
}

export function useActualizarUsuario() {
  const { actualizarUsuario } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: { id: number; cambios: CambiosDeCuenta }) => actualizarUsuario.ejecutar(datos.id, datos.cambios),
    // Un cambio de rol afecta a quién puede administrar cada grupo
    onSuccess: () => Promise.all([cliente.invalidateQueries({ queryKey: claves.usuarios }), cliente.invalidateQueries({ queryKey: claves.grupos })]),
  })
}

export function useAnonimizarUsuario() {
  const { anonimizarUsuario } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (id: number) => anonimizarUsuario.ejecutar(id),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.usuarios }),
  })
}

export function useCrearGrupo() {
  const { crearGrupo } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: DatosDeGrupo) => crearGrupo.ejecutar(datos),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.grupos }),
  })
}

export function useActualizarGrupo() {
  const { actualizarGrupo } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: { grupo: GrupoAdministrable; cambios: DatosDeGrupo }) => actualizarGrupo.ejecutar(datos.grupo, datos.cambios),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.grupos }),
  })
}

export function useAsignarAdministradores() {
  const { asignarAdministradores } = useCasosDeUso()
  const cliente = useQueryClient()
  const claves = useClaves()
  return useMutation({
    mutationFn: (datos: { grupoId: number; administradorIds: number[] }) =>
      asignarAdministradores.ejecutar(datos.grupoId, datos.administradorIds),
    onSuccess: () => cliente.invalidateQueries({ queryKey: claves.grupos }),
  })
}
