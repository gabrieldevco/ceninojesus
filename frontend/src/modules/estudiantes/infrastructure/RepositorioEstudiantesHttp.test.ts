import { ErrorApi } from '@/shared/http/errores'
import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioEstudiantesHttp } from './RepositorioEstudiantesHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const ESTUDIANTE_API = {
  id: 10,
  nombres: 'Luis',
  apellidos: 'Pérez',
  documento_identidad: '123',
  fecha_nacimiento: '2016-04-10',
  grado: '5°',
  acudiente_id: 7,
  usuario_id: null,
  fecha_autorizacion_datos: '2026-10-28T10:00:00-05:00',
}

function armar(rutas: (url: string, opciones: RequestInit) => Response) {
  const fetchFalso = vi.fn((url: string, opciones: RequestInit) => Promise.resolve(rutas(url, opciones)))
  const http = new FetchHttpClient('/api', undefined, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioEstudiantesHttp(http), fetchFalso }
}

describe('RepositorioEstudiantesHttp', () => {
  it('lista los estudiantes con el nombre completo', async () => {
    const { repo } = armar(() => respuesta(200, [ESTUDIANTE_API]))
    expect(await repo.listar()).toEqual([
      {
        id: 10,
        nombres: 'Luis',
        apellidos: 'Pérez',
        nombre: 'Luis Pérez',
        grado: '5°',
        documentoIdentidad: '123',
        fechaNacimiento: '2016-04-10',
      },
    ])
  })

  it('registra enviando los nombres de campo de la API y la autorización', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(201, ESTUDIANTE_API))

    await repo.registrar({
      nombres: 'Luis',
      apellidos: 'Pérez',
      grado: '5°',
      documentoIdentidad: '123',
      fechaNacimiento: null,
      autorizaTratamientoDatos: true,
    })

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/estudiantes/')
    expect(JSON.parse(opciones.body as string)).toEqual({
      nombres: 'Luis',
      apellidos: 'Pérez',
      grado: '5°',
      documento_identidad: '123',
      fecha_nacimiento: null,
      autoriza_tratamiento_datos: true,
    })
  })

  it('conserva los errores por campo de la API', async () => {
    const { repo } = armar(() => respuesta(400, { documento_identidad: ['Documento ya registrado.'] }))
    const error = await repo
      .registrar({ nombres: 'A', apellidos: 'B', grado: '', documentoIdentidad: '1', fechaNacimiento: null, autorizaTratamientoDatos: true })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({ campos: { documento_identidad: ['Documento ya registrado.'] } })
  })
})
