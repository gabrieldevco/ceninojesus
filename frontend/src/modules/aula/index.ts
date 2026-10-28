import { ListarMateriales } from './application/listarMateriales'
import { RepositorioMaterialesDemo } from './infrastructure/RepositorioMaterialesDemo'
import type { CasosDeUsoAula } from './presentation/AulaProvider'

export { AulaProvider } from './presentation/AulaProvider'
export { default as AulaPage } from './presentation/AulaPage'

export function crearCasosDeUsoAula(): CasosDeUsoAula {
  return { listarMateriales: new ListarMateriales(new RepositorioMaterialesDemo()) }
}
