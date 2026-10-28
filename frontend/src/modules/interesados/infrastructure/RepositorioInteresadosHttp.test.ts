import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioInteresadosHttp } from './RepositorioInteresadosHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const NUEVO = {
  nombreCompleto: 'María López',
  correo: 'maria@example.com',
  telefono: '3001234567',
  nombreAspirante: 'Luis',
  gradoInteres: 'Primaria' as const,
  mensaje: '¿Hay cupos?',
  autorizaTratamientoDatos: true,
}

function armar(rutas: () => Response) {
  const fetchFalso = vi.fn((...argumentos: [url: string, opciones?: RequestInit]) => {
    void argumentos
    return Promise.resolve(rutas())
  })
  const proveedor = { tokenDeAcceso: () => 'abc', renovar: () => Promise.resolve(null) }
  const http = new FetchHttpClient('/api', proveedor, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioInteresadosHttp(http), fetchFalso }
}

describe('RepositorioInteresadosHttp', () => {
  it('envía el formulario con los nombres de campo de la API y sin token (es público)', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(201, { id: 1 }))

    await repo.registrar(NUEVO)

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/interesados/')
    expect(opciones.headers).not.toHaveProperty('Authorization')
    expect(JSON.parse(opciones.body as string)).toEqual({
      nombre_completo: 'María López',
      correo: 'maria@example.com',
      telefono: '3001234567',
      nombre_aspirante: 'Luis',
      grado_interes: 'Primaria',
      mensaje: '¿Hay cupos?',
      autoriza_tratamiento_datos: true,
    })
  })

  it('conserva los errores por campo de la API', async () => {
    const { repo } = armar(() => respuesta(400, { correo: ['Introduzca una dirección de correo electrónico válida.'] }))
    await expect(repo.registrar(NUEVO)).rejects.toMatchObject({
      estado: 400,
      campos: { correo: ['Introduzca una dirección de correo electrónico válida.'] },
    })
  })

  it('distingue el límite de envíos (429)', async () => {
    const { repo } = armar(() => respuesta(429, { detail: 'Solicitud limitada.' }))
    await expect(repo.registrar(NUEVO)).rejects.toMatchObject({ estado: 429 })
  })
})
