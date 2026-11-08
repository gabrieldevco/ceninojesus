export interface Grupo {
  id: number
  nombre: string
  descripcion: string
  horario: string
  /** Sin límite si es `null` */
  cupoMaximo: number | null
}

export interface NuevoGrupo {
  nombre: string
  descripcion: string
  horario: string
}

export class GrupoInvalido extends Error {
  constructor(readonly campo: 'nombre', mensaje: string) {
    super(mensaje)
    this.name = 'GrupoInvalido'
  }
}

export function validarNuevoGrupo(nuevo: NuevoGrupo): NuevoGrupo {
  const nombre = nuevo.nombre.trim()
  if (!nombre) throw new GrupoInvalido('nombre', 'Escribe el nombre de la clase.')
  if (nombre.length > 100) throw new GrupoInvalido('nombre', 'El nombre no puede pasar de 100 caracteres.')
  return { nombre, descripcion: nuevo.descripcion.trim(), horario: nuevo.horario.trim().slice(0, 200) }
}
