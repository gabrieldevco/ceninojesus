import type { RepositorioSolicitudes } from '../domain/puertos'
import {
  MotivoRequerido,
  SolicitudDuplicada,
  type EstadoSolicitud,
  type NuevaSolicitud,
  type SolicitudMatricula,
} from '../domain/solicitud'
import { EnviarSolicitud, ResolverSolicitud } from './casosDeUso'

/** Repositorio en memoria: los casos de uso se prueban sin red ni almacenamiento. */
class RepositorioFalso implements RepositorioSolicitudes {
  datos: SolicitudMatricula[] = []

  listar() {
    return Promise.resolve(this.datos)
  }

  crear(nueva: NuevaSolicitud) {
    const solicitud: SolicitudMatricula = { ...nueva, id: this.datos.length + 1, fecha: '2026-10-01', estado: 'pendiente' }
    this.datos = [solicitud, ...this.datos]
    return Promise.resolve(solicitud)
  }

  resolver(id: number, estado: Exclude<EstadoSolicitud, 'pendiente'>, motivo?: string) {
    const actual = this.datos.find((s) => s.id === id)
    if (!actual) return Promise.reject(new Error('no existe'))
    const resuelta = { ...actual, estado, ...(motivo ? { motivo } : {}) }
    this.datos = this.datos.map((s) => (s.id === id ? resuelta : s))
    return Promise.resolve(resuelta)
  }
}

const nueva: NuevaSolicitud = { estudiante: 'Ana', acudiente: 'Marta', correo: 'm@example.com', grupo: 'Ajedrez' }

describe('EnviarSolicitud', () => {
  it('crea la solicitud como pendiente', async () => {
    const repo = new RepositorioFalso()
    const creada = await new EnviarSolicitud(repo).ejecutar(nueva)
    expect(creada.estado).toBe('pendiente')
    expect(repo.datos).toHaveLength(1)
  })

  it('rechaza una solicitud repetida', async () => {
    const caso = new EnviarSolicitud(new RepositorioFalso())
    await caso.ejecutar(nueva)
    await expect(caso.ejecutar(nueva)).rejects.toBeInstanceOf(SolicitudDuplicada)
  })
})

describe('ResolverSolicitud', () => {
  it('aprueba sin motivo', async () => {
    const repo = new RepositorioFalso()
    const { id } = await repo.crear(nueva)
    expect((await new ResolverSolicitud(repo).aprobar(id)).estado).toBe('aprobada')
  })

  it('exige motivo para rechazar y lo guarda limpio', async () => {
    const repo = new RepositorioFalso()
    const { id } = await repo.crear(nueva)
    const caso = new ResolverSolicitud(repo)
    await expect(caso.rechazar(id, '  ')).rejects.toBeInstanceOf(MotivoRequerido)
    const rechazada = await caso.rechazar(id, '  Cupo no disponible ')
    expect(rechazada).toMatchObject({ estado: 'rechazada', motivo: 'Cupo no disponible' })
  })
})
