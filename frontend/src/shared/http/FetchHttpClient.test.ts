import { ErrorApi, ErrorDeRed, NoAutorizado } from './errores'
import { FetchHttpClient } from './FetchHttpClient'
import type { ProveedorDeToken } from './HttpClient'

const json = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

class ProveedorFalso implements ProveedorDeToken {
  renovaciones = 0
  constructor(
    public token: string | null,
    private readonly nuevo: string | null = 'nuevo',
  ) {}

  tokenDeAcceso() {
    return this.token
  }

  async renovar() {
    this.renovaciones++
    await Promise.resolve()
    this.token = this.nuevo
    return this.nuevo
  }
}

describe('FetchHttpClient', () => {
  it('envía JSON, el token y devuelve el cuerpo', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(json(200, { ok: true }))
    const cliente = new FetchHttpClient('/api/', new ProveedorFalso('abc'), fetchFalso)

    const resultado = await cliente.enviar({ metodo: 'POST', ruta: '/x/', cuerpo: { a: 1 } })

    expect(resultado).toEqual({ ok: true })
    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/x/')
    expect(opciones.body).toBe('{"a":1}')
    expect(opciones.headers).toMatchObject({ Authorization: 'Bearer abc', 'Content-Type': 'application/json' })
  })

  it('envía un FormData tal cual, sin fijar el Content-Type', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(json(201, {}))
    const formulario = new FormData()
    formulario.append('titulo', 'Guía')

    await new FetchHttpClient('/api', undefined, fetchFalso).enviar({ metodo: 'POST', ruta: '/x/', cuerpo: formulario })

    const [, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(opciones.body).toBe(formulario)
    expect(opciones.headers).not.toHaveProperty('Content-Type')
  })

  it('descarga un archivo con el token y el nombre del servidor', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(
      new Response('contenido', { status: 200, headers: { 'Content-Disposition': 'attachment; filename="a b.pdf"' } }),
    )
    const archivo = await new FetchHttpClient('/api', new ProveedorFalso('abc'), fetchFalso).descargar({ ruta: '/x/archivo/' })

    expect(archivo.nombre).toBe('a b.pdf')
    expect(await archivo.contenido.text()).toBe('contenido')
    expect((fetchFalso.mock.calls[0] as [string, RequestInit])[1].headers).toMatchObject({ Authorization: 'Bearer abc' })
  })

  it('no envía el token en las peticiones no autenticadas', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(json(200, {}))
    await new FetchHttpClient('/api', new ProveedorFalso('abc'), fetchFalso).enviar({
      metodo: 'POST',
      ruta: '/auth/token/',
      autenticada: false,
    })
    expect((fetchFalso.mock.calls[0] as [string, RequestInit])[1].headers).not.toHaveProperty('Authorization')
  })

  it('ante un 401 renueva el token y repite la petición una vez', async () => {
    const fetchFalso = vi.fn().mockResolvedValueOnce(json(401)).mockResolvedValueOnce(json(200, { dato: 1 }))
    const proveedor = new ProveedorFalso('viejo')

    const resultado = await new FetchHttpClient('/api', proveedor, fetchFalso).enviar({ metodo: 'GET', ruta: '/perfil/' })

    expect(resultado).toEqual({ dato: 1 })
    expect(proveedor.renovaciones).toBe(1)
    expect((fetchFalso.mock.calls[1] as [string, RequestInit])[1].headers).toMatchObject({ Authorization: 'Bearer nuevo' })
  })

  it('varias peticiones con 401 comparten una sola renovación', async () => {
    const fetchFalso = vi.fn().mockImplementation((_url: string, opciones: RequestInit) =>
      Promise.resolve(
        (opciones.headers as Record<string, string>).Authorization === 'Bearer nuevo' ? json(200, {}) : json(401),
      ),
    )
    const proveedor = new ProveedorFalso('viejo')
    const cliente = new FetchHttpClient('/api', proveedor, fetchFalso)

    await Promise.all([cliente.enviar({ metodo: 'GET', ruta: '/a/' }), cliente.enviar({ metodo: 'GET', ruta: '/b/' })])

    expect(proveedor.renovaciones).toBe(1)
  })

  it('si no se puede renovar lanza NoAutorizado', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(json(401))
    const cliente = new FetchHttpClient('/api', new ProveedorFalso('viejo', null), fetchFalso)
    await expect(cliente.enviar({ metodo: 'GET', ruta: '/perfil/' })).rejects.toBeInstanceOf(NoAutorizado)
  })

  it('traduce los errores de la API', async () => {
    const detalle = new FetchHttpClient('/api', undefined, vi.fn().mockResolvedValue(json(403, { detail: 'Sin permiso' })))
    await expect(detalle.enviar({ metodo: 'GET', ruta: '/x/' })).rejects.toMatchObject({ estado: 403, detalle: 'Sin permiso' })

    const campos = new FetchHttpClient('/api', undefined, vi.fn().mockResolvedValue(json(400, { correo: ['No es válido.'] })))
    const error = await campos.enviar({ metodo: 'POST', ruta: '/x/', cuerpo: {} }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({ detalle: 'No es válido.', campos: { correo: ['No es válido.'] } })
  })

  it('traduce un fallo de red', async () => {
    const cliente = new FetchHttpClient('/api', undefined, vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(cliente.enviar({ metodo: 'GET', ruta: '/x/' })).rejects.toBeInstanceOf(ErrorDeRed)
  })
})
