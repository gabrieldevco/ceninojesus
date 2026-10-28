import type { HttpClient } from '@/shared/http/HttpClient'
import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import { ListarEstudiantes, RegistrarEstudiante } from './application/casosDeUso'
import type { RepositorioEstudiantes } from './domain/puertos'
import { RepositorioEstudiantesDemo } from './infrastructure/RepositorioEstudiantesDemo'
import { RepositorioEstudiantesHttp } from './infrastructure/RepositorioEstudiantesHttp'
import type { CasosDeUsoEstudiantes } from './presentation/EstudiantesProvider'

export type { Estudiante } from './domain/estudiante'
export { EstudiantesProvider, useEstudiantes } from './presentation/EstudiantesProvider'
export { default as EstudiantesPage } from './presentation/EstudiantesPage'

export function crearCasosDeUsoEstudiantes({
  http,
  almacenamiento,
  modoDemo,
}: {
  http: HttpClient
  almacenamiento: Almacenamiento
  modoDemo: boolean
}): CasosDeUsoEstudiantes {
  const repositorio: RepositorioEstudiantes = modoDemo
    ? new RepositorioEstudiantesDemo(almacenamiento)
    : new RepositorioEstudiantesHttp(http)
  return { listarEstudiantes: new ListarEstudiantes(repositorio), registrarEstudiante: new RegistrarEstudiante(repositorio) }
}
