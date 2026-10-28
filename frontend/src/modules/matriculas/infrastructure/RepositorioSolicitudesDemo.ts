import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import type { CatalogoMatricula, RepositorioSolicitudes } from '../domain/puertos'
import type { EstadoSolicitud, NuevaSolicitud, SolicitudMatricula } from '../domain/solicitud'

const CLAVE = 'nj_requests_v3'

const familia = (letra: string) => ({ acudiente: `Acudiente demo ${letra}`, correo: `familia.${letra.toLowerCase()}@example.com` })

const SEMILLA: SolicitudMatricula[] = [
  { id: 1, estudiante: 'Estudiante demo A', ...familia('A'), grupo: 'Robótica', fecha: '2026-10-03', estado: 'pendiente' },
  { id: 2, estudiante: 'Estudiante demo A', ...familia('A'), grupo: 'Ajedrez', fecha: '2026-10-01', estado: 'aprobada' },
  { id: 3, estudiante: 'Estudiante demo A', ...familia('A'), grupo: 'Danza y arte', fecha: '2026-10-01', estado: 'aprobada' },
  { id: 4, estudiante: 'Estudiante demo B', ...familia('A'), grupo: 'Música', fecha: '2026-09-30', estado: 'rechazada', motivo: 'Cupo no disponible' },
  { id: 5, estudiante: 'Estudiante demo B', ...familia('B'), grupo: 'Robótica', fecha: '2026-10-03', estado: 'pendiente' },
  { id: 6, estudiante: 'Estudiante demo C', ...familia('C'), grupo: 'Robótica', fecha: '2026-10-02', estado: 'pendiente' },
  { id: 7, estudiante: 'Estudiante demo D', ...familia('D'), grupo: 'Robótica', fecha: '2026-10-01', estado: 'aprobada' },
  { id: 8, estudiante: 'Estudiante demo E', ...familia('E'), grupo: 'Robótica', fecha: '2026-10-01', estado: 'aprobada' },
  { id: 9, estudiante: 'Estudiante demo F', ...familia('F'), grupo: 'Robótica', fecha: '2026-09-30', estado: 'rechazada', motivo: 'Cupo no disponible' },
]

/** Solicitudes de demostración guardadas en el navegador; se reemplaza por el repositorio HTTP. */
export class RepositorioSolicitudesDemo implements RepositorioSolicitudes, CatalogoMatricula {
  constructor(private readonly almacenamiento: Almacenamiento) {}

  private leer(): SolicitudMatricula[] {
    return this.almacenamiento.leer<SolicitudMatricula[]>(CLAVE) ?? SEMILLA
  }

  listar(): Promise<SolicitudMatricula[]> {
    return Promise.resolve(this.leer())
  }

  crear(nueva: NuevaSolicitud): Promise<SolicitudMatricula> {
    const actuales = this.leer()
    const solicitud: SolicitudMatricula = {
      ...nueva,
      id: Math.max(0, ...actuales.map((s) => s.id)) + 1,
      fecha: new Date().toISOString().slice(0, 10),
      estado: 'pendiente',
    }
    this.almacenamiento.guardar(CLAVE, [solicitud, ...actuales])
    return Promise.resolve(solicitud)
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

  estudiantes(): Promise<string[]> {
    return Promise.resolve(['Estudiante demo A', 'Estudiante demo B'])
  }
}
