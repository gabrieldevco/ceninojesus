import { AlmacenamientoMemoria } from '@/shared/lib/almacenamiento'
import { ErrorApi } from '@/shared/http/errores'
import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { DemasiadosIntentos } from '../domain/puertos'
import { GestorDeSesion } from './GestorDeSesion'
import { RepositorioAutenticacionHttp } from './RepositorioAutenticacionHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const PERFIL = { id: 7, nombre_usuario: 'maria', nombres: 'María', apellidos: 'López', rol: 'acudiente' }

/** Arma el repositorio sobre un backend falso: `rutas` decide la respuesta de cada petición. */
function armar(rutas: (url: string, opciones: RequestInit) => Response) {
  const almacenamiento = new AlmacenamientoMemoria()
  const fetchFalso = vi.fn((url: string, opciones: RequestInit) => Promise.resolve(rutas(url, opciones)))
  // El gestor necesita un cliente para renovar; el cliente necesita al gestor para el token.
  const sinToken = new FetchHttpClient('/api', undefined, fetchFalso as unknown as typeof fetch)
  const sesion = new GestorDeSesion(almacenamiento, sinToken)
  const http = new FetchHttpClient('/api', sesion, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioAutenticacionHttp(http, sesion), sesion, almacenamiento, fetchFalso }
}

describe('RepositorioAutenticacionHttp', () => {
  it('inicia sesión, guarda los tokens y devuelve el usuario con su rol', async () => {
    const { repo, sesion } = armar((url) =>
      url.endsWith('/auth/token/') ? respuesta(200, { access: 'A1', refresh: 'R1' }) : respuesta(200, PERFIL),
    )

    const usuario = await repo.iniciarSesion('maria', 'clave')

    expect(usuario).toMatchObject({ id: 7, nombre: 'María López', rol: 'acudiente', inicio: '/familias/matricula' })
    expect(sesion.tokenDeAcceso()).toBe('A1')
    expect(sesion.refresco()).toBe('R1')
  })

  it('devuelve null con credenciales incorrectas y no guarda nada', async () => {
    const { repo, sesion } = armar(() => respuesta(401, { detail: 'No active account' }))
    expect(await repo.iniciarSesion('maria', 'mala')).toBeNull()
    expect(sesion.refresco()).toBeNull()
  })

  it('lanza DemasiadosIntentos cuando el backend bloquea la cuenta', async () => {
    const { repo } = armar(() => respuesta(429, { detail: 'bloqueado' }))
    await expect(repo.iniciarSesion('maria', 'x')).rejects.toBeInstanceOf(DemasiadosIntentos)
  })

  it('propaga otros errores del servidor', async () => {
    const { repo } = armar(() => respuesta(500, { detail: 'falla' }))
    await expect(repo.iniciarSesion('maria', 'x')).rejects.toBeInstanceOf(ErrorApi)
  })

  it('al recargar recupera la sesión renovando con el refresh guardado y lo rota', async () => {
    const { repo, sesion, almacenamiento } = armar((url, opciones) => {
      if (url.endsWith('/auth/token/refresh/')) return respuesta(200, { access: 'A2', refresh: 'R2' })
      const autorizado = (opciones.headers as Record<string, string>).Authorization === 'Bearer A2'
      return autorizado ? respuesta(200, PERFIL) : respuesta(401)
    })
    almacenamiento.guardar('nj_refresh', 'R1')

    const usuario = await repo.obtenerSesion()

    expect(usuario?.identificador).toBe('maria')
    expect(sesion.refresco()).toBe('R2')
  })

  it('sin sesión guardada o con el refresh vencido no hay usuario', async () => {
    const vacia = armar(() => respuesta(200, PERFIL))
    expect(await vacia.repo.obtenerSesion()).toBeNull()

    const vencida = armar(() => respuesta(401, { detail: 'token vencido' }))
    vencida.almacenamiento.guardar('nj_refresh', 'viejo')
    expect(await vencida.repo.obtenerSesion()).toBeNull()
    expect(vencida.sesion.refresco()).toBeNull()
  })

  it('cerrar sesión limpia lo local y revoca el refresh en el servidor', async () => {
    const { repo, sesion, fetchFalso } = armar(() => respuesta(204))
    sesion.guardar({ access: 'A', refresh: 'R' })

    await repo.cerrarSesion()

    expect(sesion.refresco()).toBeNull()
    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/auth/logout/')
    expect(opciones.body).toBe('{"refresh":"R"}')
  })

  it('cerrar sesión no falla aunque el servidor no responda', async () => {
    const { repo, sesion } = armar(() => {
      throw new TypeError('sin red')
    })
    sesion.guardar({ access: 'A', refresh: 'R' })
    await expect(repo.cerrarSesion()).resolves.toBeUndefined()
    expect(sesion.refresco()).toBeNull()
  })
})
