import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioInstitucionalHttp } from './RepositorioInstitucionalHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const MENSAJE = {
  nombre: 'María López',
  correo: 'maria@example.com',
  telefono: '',
  asunto: 'Horarios',
  mensaje: '¿Cuál es el horario?',
  autorizaTratamientoDatos: true,
}

function armar(rutas: () => Response) {
  const fetchFalso = vi.fn((...argumentos: [url: string, opciones?: RequestInit]) => {
    void argumentos
    return Promise.resolve(rutas())
  })
  const proveedor = { tokenDeAcceso: () => 'abc', renovar: () => Promise.resolve(null) }
  const http = new FetchHttpClient('/api', proveedor, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioInstitucionalHttp(http), fetchFalso }
}

describe('RepositorioInstitucionalHttp', () => {
  it('envía el mensaje con los nombres de campo de la API y sin token (es público)', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(201, { id: 1 }))

    await repo.enviarMensaje(MENSAJE)

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/institucional/contacto/')
    expect(opciones.headers).not.toHaveProperty('Authorization')
    expect(JSON.parse(opciones.body as string)).toEqual({
      nombre: 'María López',
      correo: 'maria@example.com',
      telefono: '',
      asunto: 'Horarios',
      mensaje: '¿Cuál es el horario?',
      autoriza_tratamiento_datos: true,
    })
  })

  it('distingue el límite de envíos (429)', async () => {
    const { repo } = armar(() => respuesta(429, { detail: 'Solicitud limitada.' }))
    await expect(repo.enviarMensaje(MENSAJE)).rejects.toMatchObject({ estado: 429 })
  })

  it('lee la política de datos', async () => {
    const { repo } = armar(() => respuesta(200, { politica: 'Texto', correo: 'datos@colegio.co' }))
    await expect(repo.politicaDeDatos()).resolves.toEqual({ texto: 'Texto', correo: 'datos@colegio.co' })
  })

  it('tolera una política aún no publicada', async () => {
    const { repo } = armar(() => respuesta(200, { politica: null, correo: null }))
    await expect(repo.politicaDeDatos()).resolves.toEqual({ texto: '', correo: '' })
  })
})
