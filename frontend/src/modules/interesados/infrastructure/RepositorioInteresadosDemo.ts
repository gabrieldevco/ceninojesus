import type { EstadoInteresado, Interesado, NuevoInteresado, Seguimiento } from '../domain/interesado'
import type { RepositorioInteresados } from '../domain/puertos'

const hoy = () => new Date().toISOString().slice(0, 10)

const interesado = (id: number, nombre: string, estado: EstadoInteresado, grado: string): Interesado => ({
  id,
  nombreCompleto: nombre,
  correo: `${nombre.split(' ')[0]?.toLowerCase() ?? 'demo'}@example.com`,
  telefono: '3000000000',
  mensaje: 'Quisiera conocer los costos y los horarios.',
  nombreAspirante: '',
  gradoInteres: grado,
  estado,
  fechaRegistro: '2026-10-20',
  fechaUltimoContacto: estado === 'nuevo' ? null : '2026-10-22',
})

/** Interesados de demostración, en memoria (modo sin backend). */
export class RepositorioInteresadosDemo implements RepositorioInteresados {
  private siguienteId = 100
  private lista: Interesado[] = [
    interesado(1, 'Laura Pérez', 'nuevo', 'Primaria'),
    interesado(2, 'Carlos Rojas', 'en_seguimiento', 'Preescolar'),
    interesado(3, 'Marta Díaz', 'matriculado', 'Media'),
  ]

  private notas: Record<number, Seguimiento[]> = { 2: [{ id: 1, nota: 'Se llamó y quedó de visitar el colegio.', fecha: '2026-10-22' }] }

  registrar(nuevo: NuevoInteresado): Promise<void> {
    this.lista = [
      {
        id: this.siguienteId++,
        nombreCompleto: nuevo.nombreCompleto,
        correo: nuevo.correo,
        telefono: nuevo.telefono,
        mensaje: nuevo.mensaje,
        nombreAspirante: nuevo.nombreAspirante,
        gradoInteres: nuevo.gradoInteres,
        estado: 'nuevo',
        fechaRegistro: hoy(),
        fechaUltimoContacto: null,
      },
      ...this.lista,
    ]
    return Promise.resolve()
  }

  listar(): Promise<Interesado[]> {
    return Promise.resolve(this.lista)
  }

  cambiarEstado(id: number, estado: EstadoInteresado): Promise<Interesado> {
    const actual = this.lista.find((i) => i.id === id)
    if (!actual) return Promise.reject(new Error(`No existe el interesado ${id}`))
    const cambiado = { ...actual, estado, fechaUltimoContacto: hoy() }
    this.lista = this.lista.map((i) => (i.id === id ? cambiado : i))
    return Promise.resolve(cambiado)
  }

  listarSeguimientos(id: number): Promise<Seguimiento[]> {
    return Promise.resolve(this.notas[id] ?? [])
  }

  registrarSeguimiento(id: number, nota: string): Promise<Seguimiento> {
    const creado: Seguimiento = { id: this.siguienteId++, nota, fecha: hoy() }
    this.notas = { ...this.notas, [id]: [creado, ...(this.notas[id] ?? [])] }
    // Igual que el backend: un contacto pasa un interesado nuevo a seguimiento
    this.lista = this.lista.map((i) =>
      i.id === id ? { ...i, estado: i.estado === 'nuevo' ? 'en_seguimiento' : i.estado, fechaUltimoContacto: hoy() } : i,
    )
    return Promise.resolve(creado)
  }
}
