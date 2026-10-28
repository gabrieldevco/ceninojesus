import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { RepositorioAdministracionHttp } from './RepositorioAdministracionHttp'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

const USUARIO = {
  id: 7,
  nombre_usuario: 'profe',
  rol: 'administrador_grupo',
  correo: 'profe@example.com',
  nombres: 'Ana',
  apellidos: 'Pérez',
  telefono: '',
  activo: true,
  fecha_autorizacion_datos: null,
}
const GRUPO = { id: 3, nombre: 'Ajedrez', descripcion: '', horario: '', cupo_maximo: null, activo: false, administrador_ids: [7] }

function armar(rutas: () => Response) {
  const fetchFalso = vi.fn((...argumentos: [url: string, opciones?: RequestInit]) => {
    void argumentos
    return Promise.resolve(rutas())
  })
  const proveedor = { tokenDeAcceso: () => 'abc', renovar: () => Promise.resolve(null) }
  const http = new FetchHttpClient('/api', proveedor, fetchFalso as unknown as typeof fetch)
  return { repo: new RepositorioAdministracionHttp(http), fetchFalso }
}

const llamada = (fetchFalso: ReturnType<typeof armar>['fetchFalso']) => fetchFalso.mock.calls[0] as [string, RequestInit]

describe('RepositorioAdministracionHttp', () => {
  it('lista las cuentas y las convierte a entidades', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, [USUARIO]))
    await expect(repo.listarUsuarios()).resolves.toEqual([
      {
        id: 7,
        nombreUsuario: 'profe',
        rol: 'administrador_grupo',
        correo: 'profe@example.com',
        nombres: 'Ana',
        apellidos: 'Pérez',
        telefono: '',
        activo: true,
      },
    ])
    expect(llamada(fetchFalso)[0]).toBe('/api/usuarios/')
  })

  it('crea una cuenta con los nombres de campo de la API', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(201, USUARIO))
    await repo.crearUsuario({
      nombreUsuario: 'profe',
      password: 'clave-segura-123',
      rol: 'administrador_grupo',
      correo: 'profe@example.com',
      nombres: 'Ana',
      apellidos: 'Pérez',
    })
    const [url, opciones] = llamada(fetchFalso)
    expect(url).toBe('/api/usuarios/')
    expect(JSON.parse(opciones.body as string)).toEqual({
      nombre_usuario: 'profe',
      password: 'clave-segura-123',
      rol: 'administrador_grupo',
      correo: 'profe@example.com',
      nombres: 'Ana',
      apellidos: 'Pérez',
    })
  })

  it('cambia el rol o el estado con PATCH', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, { ...USUARIO, activo: false }))
    await expect(repo.actualizarUsuario(7, { activo: false })).resolves.toMatchObject({ activo: false })
    const [url, opciones] = llamada(fetchFalso)
    expect([url, opciones.method, opciones.body]).toEqual(['/api/usuarios/7/', 'PATCH', '{"activo":false}'])
  })

  it('anonimiza con POST', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, { ...USUARIO, nombre_usuario: 'anonimo-7', activo: false }))
    await expect(repo.anonimizarUsuario(7)).resolves.toMatchObject({ nombreUsuario: 'anonimo-7' })
    expect(llamada(fetchFalso)[0]).toBe('/api/usuarios/7/anonimizar/')
  })

  it('pide los grupos inactivos también', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, [GRUPO]))
    await expect(repo.listarGrupos()).resolves.toEqual([
      { id: 3, nombre: 'Ajedrez', descripcion: '', horario: '', cupoMaximo: null, activo: false, administradorIds: [7] },
    ])
    expect(llamada(fetchFalso)[0]).toBe('/api/grupos/?todos=true')
  })

  it('crea y asigna administradores de un grupo', async () => {
    const { repo, fetchFalso } = armar(() => respuesta(200, GRUPO))
    await repo.asignarAdministradores(3, [7])
    const [url, opciones] = llamada(fetchFalso)
    expect([url, opciones.method, opciones.body]).toEqual(['/api/grupos/3/administradores/', 'PUT', '{"administrador_ids":[7]}'])
  })

  it('conserva el mensaje de la API cuando se niega el cambio', async () => {
    const { repo } = armar(() => respuesta(403, { detail: 'No puede desactivar su cuenta ni quitarse el rol de administrador.' }))
    await expect(repo.actualizarUsuario(1, { activo: false })).rejects.toMatchObject({
      estado: 403,
      detalle: 'No puede desactivar su cuenta ni quitarse el rol de administrador.',
    })
  })
})
