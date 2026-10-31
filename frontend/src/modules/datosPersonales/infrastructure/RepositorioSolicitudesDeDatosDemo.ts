import type { RepositorioSolicitudesDeDatos } from '../domain/puertos'
import type { NuevaSolicitud, SolicitudDeDatos } from '../domain/solicitud'

const hoy = () => new Date().toISOString().slice(0, 10)

const solicitud = (id: number, nombre: string, tipo: SolicitudDeDatos['tipo'], estado: SolicitudDeDatos['estado'], limite: string): SolicitudDeDatos => ({
  id,
  nombre,
  correo: `${nombre.split(' ')[0]?.toLowerCase() ?? 'demo'}@example.com`,
  documentoIdentidad: '',
  tipo,
  descripcion: 'Quiero saber qué datos suyos y de su hijo tiene el colegio.',
  estado,
  respuesta: estado === 'resuelta' ? 'Le enviamos la información al correo registrado.' : '',
  fechaSolicitud: '2026-10-01',
  fechaLimite: limite,
  fechaRespuesta: estado === 'resuelta' ? '2026-10-05' : null,
})

/** Solicitudes de demostración, en memoria (modo sin backend). */
export class RepositorioSolicitudesDeDatosDemo implements RepositorioSolicitudesDeDatos {
  private siguienteId = 100
  private lista: SolicitudDeDatos[] = [
    solicitud(1, 'Laura Pérez', 'supresion', 'recibida', '2099-12-31'),
    solicitud(2, 'Carlos Rojas', 'consulta', 'recibida', '2020-01-10'),
    solicitud(3, 'Marta Díaz', 'rectificacion', 'resuelta', '2026-10-20'),
  ]

  radicar(nueva: NuevaSolicitud): Promise<void> {
    this.lista = [
      ...this.lista,
      {
        id: this.siguienteId++,
        ...nueva,
        estado: 'recibida',
        respuesta: '',
        fechaSolicitud: hoy(),
        fechaLimite: '2099-12-31',
        fechaRespuesta: null,
      },
    ]
    return Promise.resolve()
  }

  listar(): Promise<SolicitudDeDatos[]> {
    return Promise.resolve(this.lista.map((s) => ({ ...s })))
  }

  tramitar(id: number): Promise<SolicitudDeDatos> {
    return this.cambiar(id, (s) => ({ ...s, estado: 'en_tramite' }))
  }

  responder(id: number, respuesta: string): Promise<SolicitudDeDatos> {
    return this.cambiar(id, (s) => ({ ...s, estado: 'resuelta', respuesta, fechaRespuesta: hoy() }))
  }

  private cambiar(id: number, cambio: (s: SolicitudDeDatos) => SolicitudDeDatos): Promise<SolicitudDeDatos> {
    const actual = this.lista.find((s) => s.id === id)
    if (!actual) return Promise.reject(new Error('Solicitud no encontrada.'))
    const nueva = cambio(actual)
    this.lista = this.lista.map((s) => (s.id === id ? nueva : s))
    return Promise.resolve({ ...nueva })
  }
}
