import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioContenidosHttp } from './RepositorioContenidosHttp'

const respuesta = (estado: number, cuerpo?: unknown, cabeceras: Record<string, string> = {}) =>
  new Response(cuerpo === undefined ? null : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), {
    status: estado,
    headers: cabeceras,
  })

const MATERIAL_API = {
  id: 4,
  grupo_id: 3,
  titulo: 'Guía de piezas',
  descripcion: 'Léela antes de la sesión',
  url: '',
  tipo: 'documento',
  publicado: true,
  fecha_publicacion: '2026-10-01T09:00:00-05:00',
  autor_id: 2,
  archivo_url: 'http://localhost:8000/api/grupos/3/materiales/4/archivo/',
}
const ACTIVIDAD_API = {
  id: 9,
  grupo_id: 3,
  titulo: 'Piensa tu jugada',
  descripcion: null,
  url: '',
  publicado: true,
  fecha_publicacion: '2026-10-03T09:00:00-05:00',
  autor_id: 2,
  archivo_url: null,
  fecha_entrega: '2026-10-08T23:59:00-05:00',
}

function armar(rutas: (url: string) => Response) {
  const fetchFalso = vi.fn((url: string) => Promise.resolve(rutas(url)))
  const http = new FetchHttpClient('/api', undefined, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioContenidosHttp(http), fetchFalso }
}

describe('RepositorioContenidosHttp', () => {
  it('lista los materiales del grupo indicando si tienen archivo', async () => {
    const { repo, fetchFalso } = armar(() =>
      respuesta(200, [MATERIAL_API, { ...MATERIAL_API, id: 5, tipo: 'enlace', archivo_url: null, url: 'https://ejemplo.com' }]),
    )

    const [documento, enlace] = await repo.materiales(3)

    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/grupos/3/materiales/')
    expect(documento).toEqual({
      id: 4,
      grupoId: 3,
      titulo: 'Guía de piezas',
      descripcion: 'Léela antes de la sesión',
      url: '',
      tieneArchivo: true,
      fechaPublicacion: '2026-10-01',
      tipo: 'documento',
    })
    expect(enlace).toMatchObject({ tipo: 'enlace', tieneArchivo: false, url: 'https://ejemplo.com' })
  })

  it('lista las actividades con su fecha de entrega y tolera campos nulos', async () => {
    const { repo } = armar(() => respuesta(200, [ACTIVIDAD_API]))
    const [actividad] = await repo.actividades(3)
    expect(actividad).toMatchObject({ titulo: 'Piensa tu jugada', descripcion: '', fechaEntrega: '2026-10-08', tieneArchivo: false })
  })

  it('descarga el archivo protegido y conserva el nombre del servidor', async () => {
    const { repo, fetchFalso } = armar(() =>
      respuesta(200, '%PDF-1.4 contenido', { 'Content-Disposition': 'attachment; filename="guia.pdf"' }),
    )

    const archivo = await repo.descargarArchivo('materiales', 3, 4)

    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/grupos/3/materiales/4/archivo/')
    expect(archivo.nombre).toBe('guia.pdf')
    expect(await archivo.contenido.text()).toBe('%PDF-1.4 contenido')
  })

  it('entiende el nombre codificado de la cabecera', async () => {
    const { repo } = armar(() =>
      respuesta(200, 'x', { 'Content-Disposition': "attachment; filename*=UTF-8''Gu%C3%ADa%20%C3%BAnica.pdf" }),
    )
    expect((await repo.descargarArchivo('actividades', 3, 9)).nombre).toBe('Guía única.pdf')
  })

  it('si no tiene permiso, la descarga falla con el mensaje de la API', async () => {
    const { repo } = armar(() => respuesta(403, { detail: 'No pertenece al grupo.' }))
    await expect(repo.descargarArchivo('materiales', 3, 4)).rejects.toMatchObject({ estado: 403, detalle: 'No pertenece al grupo.' })
  })

  it('rechaza una respuesta que no tiene la forma esperada', async () => {
    const { repo } = armar(() => respuesta(200, [{ id: 'x' }]))
    await expect(repo.materiales(3)).rejects.toThrow()
  })
})
