import type { Grupo } from '../domain/grupo'
import type { RepositorioGrupos } from '../domain/puertos'

const GRUPOS_DEMO: Grupo[] = [
  {
    id: 1,
    nombre: 'Ajedrez',
    descripcion: 'Piensa antes de mover. Recursos de demostración para explorar estrategias y aprender las reglas del juego.',
    horario: '',
    cupoMaximo: null,
  },
  { id: 2, nombre: 'Robótica', descripcion: 'Construye, programa y prueba. Material de demostración del grupo.', horario: '', cupoMaximo: null },
  {
    id: 3,
    nombre: 'Danza y arte',
    descripcion: 'Expresión, ritmo y creatividad. Material de demostración para cada sesión.',
    horario: '',
    cupoMaximo: null,
  },
  { id: 4, nombre: 'Música', descripcion: 'Escucha, practica y comparte. Material de demostración del grupo.', horario: '', cupoMaximo: null },
]

/** Grupos de demostración (modo sin backend). En la demo, "mis grupos" son los que tienen matrícula aprobada. */
export class RepositorioGruposDemo implements RepositorioGrupos {
  listar(): Promise<Grupo[]> {
    return Promise.resolve(GRUPOS_DEMO)
  }

  listarMios(): Promise<Grupo[]> {
    return Promise.resolve(GRUPOS_DEMO.filter((g) => ['Ajedrez', 'Danza y arte'].includes(g.nombre)))
  }
}
