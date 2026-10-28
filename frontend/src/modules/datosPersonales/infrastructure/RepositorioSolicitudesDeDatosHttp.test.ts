import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioSolicitudesDeDatosHttp } from './RepositorioSolicitudesDeDatosHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const SOLICITUD = {
  id: 5,
  nombre: 'María López',
  correo: 'maria@example.com',
  documento_identidad: '',
  tipo: 'supresion',
  descripcion: 'Borren mis datos',
  estado: 'recibida',
  respuesta: '',
  fecha_solicitud: '2026-10-01T15:30:00Z',
  fecha_limite: '2026-10-22',
  fecha_respuesta: null,
}

function armar(rutas: () => Response) {
  const fetchFalso = vi.fn((...argumentos: [url: string, opciones?: RequestInit]) => {
    void argumentos
    return Promise.resolve(rutas())
  })
  const proveedor = { tokenDeAcceso: () => 'abc', renovar: () => Promise.resolve(null) }
  const http = new FetchHttpClient('/api', proveedor, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioSolicitudesDeDatosHttp(http), fetchFalso }
}

const llamada = (fetchFalso: ReturnType<typeof armar>['fetchFalso']) => fetchFalso.mock.calls[0] as [string, RequestInit]

describe('RepositorioSolicitudesDeDatosHttp', () => {
  it('radica con los nombres de campo de la API y sin token (es público)', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(201, SOLICITUD))
    await repo.radicar({
      nombre: 'María López',
      correo: 'maria@example.com',
      documentoIdentidad: '123',
      tipo: 'supresion',
      descripcion: 'Borren mis datos',
    })
    const [url, opciones] = llamada(fetchFalso)
    expect(url).toBe('/api/datos-personales/solicitudes/')
    expect(opciones.headers).not.toHaveProperty('Authorization')
    expect(JSON.parse(opciones.body as string)).toEqual({
      nombre: 'María López',
      correo: 'maria@example.com',
      documento_identidad: '123',
      tipo: 'supresion',
      descripcion: 'Borren mis datos',
    })
  })

  it('lista las solicitudes y convierte las fechas a día', async () => {
    const { repo } = armar(() => respuesta(200, [SOLICITUD]))
    await expect(repo.listar()).resolves.toEqual([
      {
        id: 5,
        nombre: 'María López',
        correo: 'maria@example.com',
        documentoIdentidad: '',
        tipo: 'supresion',
        descripcion: 'Borren mis datos',
        estado: 'recibida',
        respuesta: '',
        fechaSolicitud: '2026-10-01',
        fechaLimite: '2026-10-22',
        fechaRespuesta: null,
      },
    ])
  })

  it('tramita y responde con POST', async () => {
    const tramitar = armar(() => respuesta(200, { ...SOLICITUD, estado: 'en_tramite' }))
    await expect(tramitar.repo.tramitar(5)).resolves.toMatchObject({ estado: 'en_tramite' })
    expect(llamada(tramitar.fetchFalso)[0]).toBe('/api/datos-personales/solicitudes/5/tramitar/')

    const responder = armar(() => respuesta(200, { ...SOLICITUD, estado: 'resuelta', respuesta: 'Listo', fecha_respuesta: '2026-10-03T10:00:00Z' }))
    await expect(responder.repo.responder(5, 'Listo')).resolves.toMatchObject({ estado: 'resuelta', fechaRespuesta: '2026-10-03' })
    const [url, opciones] = llamada(responder.fetchFalso)
    expect([url, opciones.body]).toEqual(['/api/datos-personales/solicitudes/5/responder/', '{"respuesta":"Listo"}'])
  })

  it('distingue el límite de envíos (429)', async () => {
    const { repo } = armar(() => respuesta(429, { detail: 'Solicitud limitada.' }))
    await expect(
      repo.radicar({ nombre: 'a', correo: 'a@b.co', documentoIdentidad: '', tipo: 'consulta', descripcion: 'x' }),
    ).rejects.toMatchObject({ estado: 429 })
  })
})
