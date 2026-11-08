import type { Grupo, NuevoGrupo } from '../domain/grupo'
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
  private grupos = [...GRUPOS_DEMO]
  private mios = ['Ajedrez', 'Danza y arte']

  listar(): Promise<Grupo[]> {
    return Promise.resolve(this.grupos)
  }

  listarMios(): Promise<Grupo[]> {
    return Promise.resolve(this.grupos.filter((g) => this.mios.includes(g.nombre)))
  }

  crear(nuevo: NuevoGrupo): Promise<Grupo> {
    if (this.grupos.some((g) => g.nombre.toLowerCase() === nuevo.nombre.toLowerCase())) {
      return Promise.reject(new Error(`Ya existe un grupo llamado ${nuevo.nombre}.`))
    }
    const creado: Grupo = { id: Math.max(...this.grupos.map((g) => g.id)) + 1, ...nuevo, cupoMaximo: null }
    this.grupos = [...this.grupos, creado]
    this.mios = [...this.mios, creado.nombre]
    return Promise.resolve(creado)
  }
}
