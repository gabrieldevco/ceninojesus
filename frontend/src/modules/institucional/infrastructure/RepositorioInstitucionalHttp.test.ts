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

  it('lista los mensajes de contacto recibidos mapeando nombres snake_case a camelCase', async () => {
    const { repo, fetchFalso } = armar(() =>
      respuesta(200, [
        {
          id: 42,
          nombre: 'Juan Pérez',
          correo: 'juan@correo.com',
          telefono: '3109998888',
          asunto: 'Admisiones 2026',
          mensaje: 'Quiero información',
          autoriza_tratamiento_datos: true,
          fecha_envio: '2026-03-01T10:00:00Z',
          leido: false,
        },
      ])
    )

    const resultado = await repo.listarMensajesContacto()
    expect(resultado).toEqual([
      {
        id: 42,
        nombre: 'Juan Pérez',
        correo: 'juan@correo.com',
        telefono: '3109998888',
        asunto: 'Admisiones 2026',
        mensaje: 'Quiero información',
        autorizaTratamientoDatos: true,
        fechaEnvio: '2026-03-01T10:00:00Z',
        leido: false,
      },
    ])
    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/institucional/contacto/')
    expect(opciones.method).toBe('GET')
  })

  it('marca un mensaje de contacto como leído enviando POST', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, { ok: true }))

    await repo.marcarMensajeContactoLeido(42)

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/institucional/contacto/42/leido/')
    expect(opciones.method).toBe('POST')
  })
})

