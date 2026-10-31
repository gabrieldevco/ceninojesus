import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioSitioHttp } from './RepositorioSitioHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const INFORMACION = {
  nombre: 'Centro Educativo El Niño Jesús',
  historia: 'H',
  mision: 'M',
  vision: 'V',
  direccion: 'Calle 1',
  ciudad: 'Barranquilla',
  telefonos: '334 4105',
  correo: 'ce@example.com',
  horario_atencion: null,
  url_mapa: '',
  url_facebook: 'https://facebook.com/x',
  politica_tratamiento_datos: '',
  portada_etiqueta: 'ETIQUETA',
  portada_titulo: 'Título',
  portada_destacado: 'destacado',
  portada_texto: 'Texto',
  quienes_principal: 'P',
  quienes_secundario: 'S',
  enfoque_titulo: 'ET',
  enfoque_texto: 'EX',
  enfoque_pasos: 'A, B',
  enfoque_nota: 'N',
  horizonte_pendiente_validacion: false,
  contacto_titulo: 'CT',
  contacto_texto: 'CX',
  pie_descripcion: 'Pie',
}
const ELEMENTO = {
  id: 4,
  seccion: 'valor',
  titulo: 'Respeto',
  texto: 'Convivir',
  detalle: '',
  icono: '🙏',
  imagen: '',
  tiene_imagen_subida: false,
  orden: 2,
  activo: true,
}

function armar(rutas: (url: string) => Response) {
  const fetchFalso = vi.fn((...argumentos: [url: string, opciones?: RequestInit]) => Promise.resolve(rutas(argumentos[0])))
  const proveedor = { tokenDeAcceso: () => 'abc', renovar: () => Promise.resolve(null) }
  const http = new FetchHttpClient('/api', proveedor, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioSitioHttp(http), fetchFalso }
}

const llamada = (fetchFalso: ReturnType<typeof armar>['fetchFalso'], n = 0) => fetchFalso.mock.calls[n] as [string, RequestInit]

describe('RepositorioSitioHttp', () => {
  it('lee el contenido público sin token y lo convierte a entidades', async () => {
    const { repo, fetchFalso } = armar((url) => (url.endsWith('/institucional/') ? respuesta(200, INFORMACION) : respuesta(200, [ELEMENTO])))
    const contenido = await repo.obtenerContenido()

    expect(contenido.informacion).toMatchObject({
      portadaDestacado: 'destacado',
      horarioAtencion: '',
      horizontePendienteValidacion: false,
      pieDescripcion: 'Pie',
    })
    expect(contenido.elementos).toEqual([
      { id: 4, seccion: 'valor', titulo: 'Respeto', texto: 'Convivir', detalle: '', icono: '🙏', imagen: '', tieneImagenSubida: false, orden: 2, activo: true },
    ])
    for (const [, opciones] of fetchFalso.mock.calls as [string, RequestInit][]) expect(opciones.headers).not.toHaveProperty('Authorization')
  })

  it('un campo nulo de la API llega como texto vacío', async () => {
    const { repo } = armar((url) => (url.endsWith('/institucional/') ? respuesta(200, { ...INFORMACION, portada_texto: null }) : respuesta(200, [])))
    await expect(repo.obtenerContenido()).resolves.toMatchObject({ informacion: { portadaTexto: '' } })
  })

  it('rechaza una respuesta que no tiene la forma esperada', async () => {
    const { repo } = armar((url) => (url.endsWith('/institucional/') ? respuesta(200, INFORMACION) : respuesta(200, [{ id: 1, seccion: 'inventada' }])))
    await expect(repo.obtenerContenido()).rejects.toThrow()
  })

  it('al guardar la información envía solo lo que cambió, con los nombres de la API', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, INFORMACION))
    await repo.actualizarInformacion({ portadaTitulo: 'Nuevo', horizontePendienteValidacion: false })
    const [url, opciones] = llamada(fetchFalso)
    expect([url, opciones.method]).toEqual(['/api/institucional/', 'PATCH'])
    expect(JSON.parse(opciones.body as string)).toEqual({ portada_titulo: 'Nuevo', horizonte_pendiente_validacion: false })
  })

  it('el administrador pide también los elementos ocultos', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, [ELEMENTO]))
    await repo.listarElementos()
    expect(llamada(fetchFalso)[0]).toBe('/api/institucional/elementos/?todos=true')
  })

  it('crea, edita y elimina elementos', async () => {
    const crear = armar(() => respuesta(201, ELEMENTO))
    await crear.repo.crearElemento({ seccion: 'valor', titulo: 'Respeto', texto: 'Convivir', detalle: '', icono: '🙏', orden: 2, activo: true })
    expect(llamada(crear.fetchFalso)[0]).toBe('/api/institucional/elementos/')

    const editar = armar(() => respuesta(200, { ...ELEMENTO, activo: false }))
    await expect(editar.repo.actualizarElemento(4, { activo: false })).resolves.toMatchObject({ activo: false })
    expect([llamada(editar.fetchFalso)[0], llamada(editar.fetchFalso)[1].method]).toEqual(['/api/institucional/elementos/4/', 'PATCH'])

    const borrar = armar(() => respuesta(204))
    await borrar.repo.eliminarElemento(4)
    expect([llamada(borrar.fetchFalso)[0], llamada(borrar.fetchFalso)[1].method]).toEqual(['/api/institucional/elementos/4/', 'DELETE'])
  })

  it('sube imágenes como multipart', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, { ...ELEMENTO, tiene_imagen_subida: true, imagen: '/api/institucional/elementos/4/imagen/?v=1' }))
    const archivo = new File([new Uint8Array([1, 2, 3])], 'foto.png', { type: 'image/png' })

    await expect(repo.subirImagen(4, archivo)).resolves.toMatchObject({ tieneImagenSubida: true })
    const [url, opciones] = llamada(fetchFalso)
    expect(url).toBe('/api/institucional/elementos/4/imagen/')
    expect(opciones.body).toBeInstanceOf(FormData)
    expect((opciones.body as FormData).get('imagen')).toBeInstanceOf(File)

    await repo.reemplazarImagenUnica('imagen_portada', archivo)
    const [urlUnica, opcionesUnica] = llamada(fetchFalso, 1)
    expect([urlUnica, opcionesUnica.method]).toEqual(['/api/institucional/imagenes/imagen_portada/', 'PUT'])
  })

  it('quita la imagen subida con DELETE', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, { ...ELEMENTO, imagen: '/img/galeria-drums.jpg' }))
    await expect(repo.quitarImagen(4)).resolves.toMatchObject({ imagen: '/img/galeria-drums.jpg', tieneImagenSubida: false })
    expect([llamada(fetchFalso)[0], llamada(fetchFalso)[1].method]).toEqual(['/api/institucional/elementos/4/imagen/', 'DELETE'])
  })

  it('administra enlaces con los nombres de la API', async () => {
    const enlace = { id: 9, nombre: 'Biblioteca', url: 'https://b.co', tipo: 'biblioteca', descripcion: '', requiere_autenticacion: true, orden: 0, activo: true }
    const { repo, fetchFalso } = armar(() => respuesta(201, enlace))
    await expect(
      repo.crearEnlace({ nombre: 'Biblioteca', url: 'https://b.co', tipo: 'biblioteca', descripcion: '', requiereAutenticacion: true, orden: 0, activo: true }),
    ).resolves.toMatchObject({ id: 9, requiereAutenticacion: true })
    expect(JSON.parse(llamada(fetchFalso)[1].body as string)).toMatchObject({ requiere_autenticacion: true, tipo: 'biblioteca' })

    const lista = armar(() => respuesta(200, [enlace]))
    await lista.repo.listarEnlacesEditables()
    expect(llamada(lista.fetchFalso)[0]).toBe('/api/institucional/enlaces/?todos=true')
  })
})
