export interface Grupo {
  id: number
  nombre: string
  descripcion: string
  horario: string
  /** Sin límite si es `null` */
  cupoMaximo: number | null
}
