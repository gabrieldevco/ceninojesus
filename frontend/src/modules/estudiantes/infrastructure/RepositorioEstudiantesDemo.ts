import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import { nombreCompleto, type Estudiante, type NuevoEstudiante } from '../domain/estudiante'
import type { RepositorioEstudiantes } from '../domain/puertos'

const CLAVE = 'nj_estudiantes_v1'

const estudiante = (id: number, letra: string): Estudiante => ({
  id,
  nombres: 'Estudiante demo',
  apellidos: letra,
  nombre: nombreCompleto('Estudiante demo', letra),
  grado: '5°',
  documentoIdentidad: '',
  fechaNacimiento: null,
  tieneAcceso: letra === 'A',
})

const SEMILLA: Estudiante[] = [estudiante(1, 'A'), estudiante(2, 'B')]

/** Estudiantes de demostración guardados en el navegador (modo sin backend). */
export class RepositorioEstudiantesDemo implements RepositorioEstudiantes {
  constructor(private readonly almacenamiento: Almacenamiento) {}

  private leer(): Estudiante[] {
    return this.almacenamiento.leer<Estudiante[]>(CLAVE) ?? SEMILLA
  }

  listar(): Promise<Estudiante[]> {
    return Promise.resolve(this.leer())
  }

  registrar(nuevo: NuevoEstudiante): Promise<Estudiante> {
    const actuales = this.leer()
    const creado: Estudiante = {
      id: Math.max(0, ...actuales.map((e) => e.id)) + 1,
      nombres: nuevo.nombres,
      apellidos: nuevo.apellidos,
      nombre: nombreCompleto(nuevo.nombres, nuevo.apellidos),
      grado: nuevo.grado,
      documentoIdentidad: nuevo.documentoIdentidad,
      fechaNacimiento: nuevo.fechaNacimiento,
      tieneAcceso: false,
    }
    this.almacenamiento.guardar(CLAVE, [...actuales, creado])
    return Promise.resolve(creado)
  }

  crearAcceso(estudianteId: number): Promise<Estudiante> {
    const actuales = this.leer()
    const actual = actuales.find((e) => e.id === estudianteId)
    if (!actual) return Promise.reject(new Error(`No existe el estudiante ${estudianteId}`))
    const conAcceso = { ...actual, tieneAcceso: true }
    this.almacenamiento.guardar(
      CLAVE,
      actuales.map((e) => (e.id === estudianteId ? conAcceso : e)),
    )
    return Promise.resolve(conAcceso)
  }

  restablecerClave(): Promise<void> {
    return Promise.resolve()
  }
}
