import type { Grupo } from '../domain/grupo'
import type { RepositorioGrupos } from '../domain/puertos'

const GRUPOS_DEMO: Grupo[] = [
  {
    nombre: 'Ajedrez',
    lema: 'Piensa antes de mover. Recursos de demostración para explorar estrategias y aprender las reglas del juego.',
    icono: '♞',
  },
  { nombre: 'Robótica', lema: 'Construye, programa y prueba. Material de demostración del grupo.', icono: '⚙' },
  {
    nombre: 'Danza y arte',
    lema: 'Expresión, ritmo y creatividad. Material de demostración para cada sesión.',
    icono: '✺',
  },
  { nombre: 'Música', lema: 'Escucha, practica y comparte. Material de demostración del grupo.', icono: '♪' },
]

/** Datos de demostración; se reemplaza por el repositorio HTTP cuando se conecte la API. */
export class RepositorioGruposDemo implements RepositorioGrupos {
  listar(): Promise<Grupo[]> {
    return Promise.resolve(GRUPOS_DEMO)
  }
}
