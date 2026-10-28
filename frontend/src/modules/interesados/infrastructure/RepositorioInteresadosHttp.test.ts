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

  const INTERESADO_API = {
    id: 8,
    nombre_completo: 'Carolina Mendoza',
    correo: 'carolina@example.com',
    telefono: '3157788990',
    mensaje: null,
    nombre_aspirante: 'Mateo',
    grado_interes: 'Secundaria',
    estado: 'nuevo',
    fecha_registro: '2026-10-28T10:00:00-05:00',
    fecha_ultimo_contacto: null,
  }

  it('lista los interesados convirtiendo fechas y tolerando campos nulos', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, [INTERESADO_API]))

    const [i] = await repo.listar()

    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/interesados/')
    expect(i).toEqual({
      id: 8,
      nombreCompleto: 'Carolina Mendoza',
      correo: 'carolina@example.com',
      telefono: '3157788990',
      mensaje: '',
      nombreAspirante: 'Mateo',
      gradoInteres: 'Secundaria',
      estado: 'nuevo',
      fechaRegistro: '2026-10-28',
      fechaUltimoContacto: null,
    })
  })

  it('cambia el estado con PATCH', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, { ...INTERESADO_API, estado: 'en_seguimiento', fecha_ultimo_contacto: '2026-10-29T09:00:00-05:00' }))

    const cambiado = await repo.cambiarEstado(8, 'en_seguimiento')

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/interesados/8/estado/')
    expect(opciones.method).toBe('PATCH')
    expect(JSON.parse(opciones.body as string)).toEqual({ estado: 'en_seguimiento' })
    expect(cambiado).toMatchObject({ estado: 'en_seguimiento', fechaUltimoContacto: '2026-10-29' })
  })

  it('propaga el error de una transición inválida', async () => {
    const { repo } = armar(() => respuesta(400, { detail: "No se puede pasar del estado 'matriculado' a 'nuevo'." }))
    await expect(repo.cambiarEstado(8, 'nuevo')).rejects.toMatchObject({ estado: 400, detalle: expect.stringContaining('No se puede pasar') as string })
  })

  it('lista los seguimientos de un interesado', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, [{ id: 1, usuario_id: 3, nota: 'Se llamó', fecha: '2026-10-29T09:00:00-05:00' }]))
    expect(await repo.listarSeguimientos(8)).toEqual([{ id: 1, nota: 'Se llamó', fecha: '2026-10-29' }])
    expect(fetchFalso.mock.calls[0]?.[0]).toBe('/api/interesados/8/seguimientos/')
  })

  it('registra un seguimiento con la nota', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(201, { id: 2, usuario_id: 3, nota: 'Visitará el colegio', fecha: '2026-10-29T09:00:00-05:00' }))

    expect(await repo.registrarSeguimiento(8, 'Visitará el colegio')).toEqual({ id: 2, nota: 'Visitará el colegio', fecha: '2026-10-29' })

    const [url, opciones] = fetchFalso.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/interesados/8/seguimientos/')
    expect(JSON.parse(opciones.body as string)).toEqual({ nota: 'Visitará el colegio' })
  })
})
