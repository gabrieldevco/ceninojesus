import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import type { RepositorioSolicitudes } from '../domain/puertos'
import type { EstadoSolicitud, NuevaSolicitud, SolicitudMatricula } from '../domain/solicitud'

const CLAVE = 'nj_requests_v4'

const GRUPOS: Record<number, string> = { 1: 'Ajedrez', 2: 'Robótica', 3: 'Danza y arte', 4: 'Música' }
const ESTUDIANTES: Record<number, string> = { 1: 'Estudiante demo A', 2: 'Estudiante demo B' }

const solicitud = (
  id: number,
  estudianteId: number,
  grupoId: number,
  fecha: string,
  estado: EstadoSolicitud,
  motivo?: string,
): SolicitudMatricula => ({
  id,
  estudianteId,
  estudiante: ESTUDIANTES[estudianteId] ?? `Estudiante demo ${estudianteId}`,
  grupoId,
  grupo: GRUPOS[grupoId] ?? '',
  comentario: '',
  fecha,
  estado,
  ...(motivo ? { motivo } : {}),
})

const SEMILLA: SolicitudMatricula[] = [
  solicitud(1, 1, 2, '2026-10-03', 'pendiente'),
  solicitud(2, 1, 1, '2026-10-01', 'aprobada'),
  solicitud(3, 1, 3, '2026-10-01', 'aprobada'),
  solicitud(4, 2, 4, '2026-09-30', 'rechazada', 'Cupo no disponible'),
  solicitud(5, 2, 2, '2026-10-03', 'pendiente'),
  solicitud(6, 3, 2, '2026-10-02', 'pendiente'),
  solicitud(7, 4, 2, '2026-10-01', 'aprobada'),
  solicitud(8, 5, 2, '2026-10-01', 'aprobada'),
  solicitud(9, 6, 2, '2026-09-30', 'rechazada', 'Cupo no disponible'),
]

/** Solicitudes de demostración guardadas en el navegador (modo sin backend). */
export class RepositorioSolicitudesDemo implements RepositorioSolicitudes {
  constructor(private readonly almacenamiento: Almacenamiento) {}

  private leer(): SolicitudMatricula[] {
    return this.almacenamiento.leer<SolicitudMatricula[]>(CLAVE) ?? SEMILLA
  }

  listar(): Promise<SolicitudMatricula[]> {
    return Promise.resolve(this.leer())
  }

  crear(nueva: NuevaSolicitud): Promise<SolicitudMatricula> {
    const actuales = this.leer()
    const id = Math.max(0, ...actuales.map((s) => s.id)) + 1
    const hoy = new Date().toISOString().slice(0, 10)
    const creada: SolicitudMatricula = {
      ...solicitud(id, nueva.estudianteId, nueva.grupoId, hoy, 'pendiente'),
      comentario: nueva.comentario ?? '',
    }
    this.almacenamiento.guardar(CLAVE, [creada, ...actuales])
    return Promise.resolve(creada)
  }

  resolver(id: number, estado: Exclude<EstadoSolicitud, 'pendiente'>, motivo?: string): Promise<SolicitudMatricula> {
    const actuales = this.leer()
    const actual = actuales.find((s) => s.id === id)
    if (!actual) return Promise.reject(new Error(`No existe la solicitud ${id}`))
    const resuelta: SolicitudMatricula = { ...actual, estado }
    if (motivo) resuelta.motivo = motivo
    else delete resuelta.motivo
    this.almacenamiento.guardar(
      CLAVE,
      actuales.map((s) => (s.id === id ? resuelta : s)),
    )
    return Promise.resolve(resuelta)
  }
}
