import { ErrorApi } from '@/shared/http/errores'
import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioSolicitudesHttp } from './RepositorioSolicitudesHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const SOLICITUD_API = {
  id: 5,
  grupo_id: 3,
  grupo_nombre: 'Ajedrez',
  estudiante_id: 10,
  estudiante_nombre: 'Luis Pérez',
  acudiente_id: 7,
  comentario: 'Le encanta',
  estado: 'pendiente',
  respuesta: '',
  fecha_solicitud: '2026-10-03T14:20:00-05:00',
  fecha_respuesta: null,
}

function armar(rutas: (url: string, opciones: RequestInit) => Response) {
  const fetchFalso = vi.fn((url: string, opciones: RequestInit) => Promise.resolve(rutas(url, opciones)))
  const http = new FetchHttpClient('/api', undefined, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioSolicitudesHttp(http), fetchFalso }
}

describe('RepositorioSolicitudesHttp', () => {
  it('lista las solicitudes convirtiendo la respuesta a entidades', async () => {
    const { repo } = armar(() =>
      respuesta(200, [SOLICITUD_API, { ...SOLICITUD_API, id: 6, estado: 'rechazada', respuesta: 'Cupo no disponible' }]),
    )

    const [pendiente, rechazada] = await repo.listar()

    expect(pendiente).toEqual({
      id: 5,
      estudianteId: 10,
      estudiante: 'Luis Pérez',
      grupoId: 3,
      grupo: 'Ajedrez',
      comentario: 'Le encanta',
      fecha: '2026-10-03',
      estado: 'pendiente',
    })
    expect(rechazada).toMatchObject({ estado: 'rechazada', motivo: 'Cupo no disponible' })
  })

  it('crea una solicitud con los ids que espera la API', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(201, SOLICITUD_API))

    await repo.crear({ estudianteId: 10, grupoId: 3, comentario: 'Hola' })

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/matriculas/')
    expect(JSON.parse(opciones.body as string)).toEqual({ grupo_id: 3, estudiante_id: 10, comentario: 'Hola' })
  })

  it('aprueba y rechaza por los endpoints correspondientes', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, SOLICITUD_API))

    await repo.resolver(5, 'aprobada')
    await repo.resolver(5, 'rechazada', 'Sin cupo')

    const [urlAprobar, urlRechazar, opcionesRechazar] = [
      fetchFalso.mock.calls[0]?.[0],
      fetchFalso.mock.calls[1]?.[0],
      fetchFalso.mock.calls[1]?.[1] as RequestInit,
    ]
    expect(urlAprobar).toBe('/api/matriculas/5/aprobar/')
    expect(urlRechazar).toBe('/api/matriculas/5/rechazar/')
    expect(JSON.parse(opcionesRechazar.body as string)).toEqual({ motivo: 'Sin cupo' })
  })

  it('propaga el mensaje de la API cuando la solicitud se rechaza por duplicada', async () => {
    const { repo } = armar(() => respuesta(400, { detail: 'Ya existe una solicitud activa.' }))
    const error = await repo.crear({ estudianteId: 10, grupoId: 3 }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({ estado: 400, detalle: 'Ya existe una solicitud activa.' })
  })

  it('rechaza una respuesta que no tiene la forma esperada', async () => {
    const { repo } = armar(() => respuesta(200, [{ id: 'no-es-numero' }]))
    await expect(repo.listar()).rejects.toThrow()
  })
})
