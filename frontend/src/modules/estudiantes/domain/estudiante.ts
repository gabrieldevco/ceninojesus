export interface Estudiante {
  id: number
  nombres: string
  apellidos: string
  /** Nombre completo, para mostrarlo */
  nombre: string
  grado: string
  documentoIdentidad: string
  /** Fecha ISO (AAAA-MM-DD) o `null` si no se registró */
  fechaNacimiento: string | null
}

export interface NuevoEstudiante {
  nombres: string
  apellidos: string
  grado: string
  documentoIdentidad: string
  fechaNacimiento: string | null
  /** El acudiente autoriza el tratamiento de los datos del menor (Ley 1581 de 2012). */
  autorizaTratamientoDatos: boolean
}

export class DatosDeEstudianteInvalidos extends Error {
  constructor(readonly campos: Partial<Record<keyof NuevoEstudiante, string>>) {
    super(Object.values(campos)[0] ?? 'Los datos del estudiante no son válidos')
    this.name = 'DatosDeEstudianteInvalidos'
  }
}

export function nombreCompleto(nombres: string, apellidos: string): string {
  return `${nombres} ${apellidos}`.trim()
}

/** Reglas que no dependen del servidor: lo que falte se corrige antes de enviar. */
export function validarNuevoEstudiante(datos: NuevoEstudiante, hoy: Date = new Date()): NuevoEstudiante {
  const campos: Partial<Record<keyof NuevoEstudiante, string>> = {}
  if (!datos.nombres.trim()) campos.nombres = 'Escribe los nombres del estudiante.'
  if (!datos.apellidos.trim()) campos.apellidos = 'Escribe los apellidos del estudiante.'
  if (datos.fechaNacimiento && new Date(datos.fechaNacimiento) > hoy) {
    campos.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.'
  }
  if (!datos.autorizaTratamientoDatos) {
    campos.autorizaTratamientoDatos = 'Debes autorizar el tratamiento de los datos del estudiante.'
  }
  if (Object.keys(campos).length > 0) throw new DatosDeEstudianteInvalidos(campos)
  return {
    ...datos,
    nombres: datos.nombres.trim(),
    apellidos: datos.apellidos.trim(),
    grado: datos.grado.trim(),
    documentoIdentidad: datos.documentoIdentidad.trim(),
  }
}
