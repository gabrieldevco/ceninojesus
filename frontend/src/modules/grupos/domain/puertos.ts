import type { Grupo } from './grupo'

export interface RepositorioGrupos {
  /** Grupos activos: es público, lo ve cualquier visitante. */
  listar(): Promise<Grupo[]>
  /** Grupos del usuario: los aprobados para sus estudiantes, o los que administra. */
  listarMios(): Promise<Grupo[]>
}
