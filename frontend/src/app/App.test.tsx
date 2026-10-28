import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AlmacenamientoMemoria } from '@/shared/lib/almacenamiento'
import App from './App'
import { Proveedores } from './Proveedores'

const respuesta = (estado: number, cuerpo?: unknown) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado })

function renderizar(ruta: string, opciones: Partial<Parameters<typeof Proveedores>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Proveedores almacenamiento={new AlmacenamientoMemoria()} {...opciones}>
        <App />
      </Proveedores>
    </MemoryRouter>,
  )
}

describe('aplicación en modo demostración', () => {
  it('sin sesión, un área restringida lleva al inicio de sesión', async () => {
    renderizar('/familias/matricula', { modoDemo: true })
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('un acudiente inicia sesión y ve su matrícula extracurricular', async () => {
    const usuario = userEvent.setup()
    renderizar('/acceso', { modoDemo: true })

    await usuario.click(await screen.findByRole('tab', { name: /acudiente/i }))
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    expect(await screen.findByRole('heading', { name: /nuevo espacio para sus talentos/i })).toBeInTheDocument()
    expect(screen.getByText('Mis solicitudes')).toBeInTheDocument()
  })

  it('un acudiente registra a un estudiante: exige la autorización y luego lo lista', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'padre')
    const usuario = userEvent.setup()
    renderizar('/familias/estudiantes', { modoDemo: true, almacenamiento })

    const [nombres, apellidos] = await screen.findAllByRole('textbox')
    await usuario.type(nombres as HTMLElement, 'Sofía')
    await usuario.type(apellidos as HTMLElement, 'Ramos')
    await usuario.click(screen.getByRole('button', { name: /registrar estudiante/i }))
    expect(await screen.findByText(/debes autorizar el tratamiento/i)).toBeInTheDocument()

    await usuario.click(screen.getByRole('checkbox'))
    await usuario.click(screen.getByRole('button', { name: /registrar estudiante/i }))

    expect(await screen.findByRole('cell', { name: 'Sofía Ramos' })).toBeInTheDocument()
  })

  it('un acudiente crea el acceso de su estudiante: valida la contraseña y luego marca "Con acceso"', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'padre')
    const usuario = userEvent.setup()
    renderizar('/familias/estudiantes', { modoDemo: true, almacenamiento })

    // El estudiante B no tiene acceso todavía: es el segundo botón "Crear acceso"
    await usuario.click(await screen.findByRole('button', { name: 'Crear acceso' }))
    const panel = screen.getByRole('form', { name: /acceso del estudiante/i })
    const [nombreUsuario, clave, confirmacion] = Array.from(panel.querySelectorAll('input'))
    await usuario.type(nombreUsuario as HTMLElement, 'estudiante-b')
    await usuario.type(clave as HTMLElement, 'corta')
    await usuario.type(confirmacion as HTMLElement, 'corta')
    await usuario.click(within(panel).getByRole('button', { name: 'Crear acceso' }))
    expect(await within(panel).findByRole('alert')).toHaveTextContent(/8 caracteres/)

    await usuario.clear(clave as HTMLElement)
    await usuario.clear(confirmacion as HTMLElement)
    await usuario.type(clave as HTMLElement, 'Clave-segura-1')
    await usuario.type(confirmacion as HTMLElement, 'Clave-segura-1')
    await usuario.click(within(panel).getByRole('button', { name: 'Crear acceso' }))

    await waitFor(() => expect(screen.getAllByText('Con acceso')).toHaveLength(2))
    expect(screen.queryByRole('form', { name: /acceso del estudiante/i })).not.toBeInTheDocument()
  })

  it('un visitante envía el formulario de admisiones: valida y luego agradece', async () => {
    const usuario = userEvent.setup()
    renderizar('/admisiones', { modoDemo: true })

    await usuario.type(await screen.findByPlaceholderText('Nombre completo'), 'Marta Gómez')
    await usuario.type(screen.getByPlaceholderText('300 000 0000'), '3001234567')
    await usuario.type(screen.getByPlaceholderText('correo@ejemplo.com'), 'marta@example.com')
    await usuario.click(screen.getByRole('button', { name: /enviar solicitud/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/autorizar el tratamiento/i)

    await usuario.click(screen.getByRole('checkbox'))
    await usuario.click(screen.getByRole('button', { name: /enviar solicitud/i }))

    expect(await screen.findByRole('heading', { name: /gracias, marta/i })).toBeInTheDocument()
  })

  it('el administrador general gestiona un interesado: registra un seguimiento y cambia su estado', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup()
    renderizar('/admin/interesados', { modoDemo: true, almacenamiento })

    await usuario.click(await screen.findByRole('cell', { name: 'Laura Pérez' }))
    expect(await screen.findByRole('heading', { name: 'Seguimiento' })).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /registrar seguimiento/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/qué se habló/i)

    await usuario.type(screen.getByPlaceholderText(/qué se habló y qué sigue/i), 'Se llamó y pidió informes de costos')
    await usuario.click(screen.getByRole('button', { name: /registrar seguimiento/i }))
    expect(await screen.findByText('Se llamó y pidió informes de costos')).toBeInTheDocument()

    // Registrar un contacto pasa al interesado de "nuevo" a "en seguimiento": ya no se ofrece ese cambio
    await waitFor(() => expect(screen.queryByRole('button', { name: /pasar a en seguimiento/i })).not.toBeInTheDocument())
    await usuario.click(screen.getByRole('button', { name: /pasar a matriculado/i }))
    expect(await screen.findByText(/este estado es final/i)).toBeInTheDocument()
  })

  it('un administrador de grupo no entra a la gestión de interesados', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'admin')
    renderizar('/admin/interesados', { modoDemo: true, almacenamiento })

    expect(await screen.findByRole('heading', { name: /revisar solicitudes de matrícula/i })).toBeInTheDocument()
  })

  it('el aula es del estudiante: un acudiente que la abre vuelve a su matrícula', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'padre')
    renderizar('/estudiante/aula', { modoDemo: true, almacenamiento })

    expect(await screen.findByRole('heading', { name: /nuevo espacio para sus talentos/i })).toBeInTheDocument()
  })

  it('un estudiante ve el material de su grupo aprobado', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'estudiante')
    renderizar('/estudiante/aula', { modoDemo: true, almacenamiento })

    expect(await screen.findByText('Guía: el tablero y las piezas')).toBeInTheDocument()
    expect(screen.getByText('Piensa tu próxima jugada')).toBeInTheDocument()
  })

  it('el administrador de grupo publica un material con enlace y puede eliminarlo', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'admin')
    const usuario = userEvent.setup()
    renderizar('/admin/contenido', { modoDemo: true, almacenamiento })

    await usuario.type(await screen.findByLabelText(/título/i), 'Tutorial de apertura')
    await usuario.click(screen.getByRole('button', { name: /publicar material/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/archivo o un enlace/i)

    await usuario.type(screen.getByPlaceholderText('https://…'), 'https://ejemplo.com/apertura')
    await usuario.click(screen.getAllByRole('button', { name: /publicar material/i }).at(-1) as HTMLElement)

    expect(await screen.findByRole('cell', { name: /Tutorial de apertura/ })).toBeInTheDocument()
    await usuario.click(screen.getAllByRole('button', { name: 'Eliminar' })[0] as HTMLElement)
    await usuario.click(screen.getByRole('button', { name: /confirmar eliminación/i }))
    await waitFor(() => expect(screen.queryByRole('cell', { name: /Tutorial de apertura/ })).not.toBeInTheDocument())
  })

  it('un estudiante no puede entrar a las solicitudes de administración', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'estudiante')
    renderizar('/admin/solicitudes', { modoDemo: true, almacenamiento })

    await waitFor(() => expect(screen.getByRole('heading', { name: /aprende, explora y participa/i })).toBeInTheDocument())
  })
})

describe('aplicación contra la API', () => {
  const perfil = { id: 7, nombre_usuario: 'maria', nombres: 'María', apellidos: 'López', rol: 'acudiente' }

  it('inicia sesión con la API y entra al portal del rol', async () => {
    const fetchFalso = vi.fn((url: string) => {
      if (url.endsWith('/auth/token/')) return Promise.resolve(respuesta(200, { access: 'A', refresh: 'R' }))
      if (url.endsWith('/auth/perfil/')) return Promise.resolve(respuesta(200, perfil))
      return Promise.resolve(respuesta(404))
    })
    const usuario = userEvent.setup()
    renderizar('/acceso', { modoDemo: false, apiUrl: '/api', fetchImpl: fetchFalso as unknown as typeof fetch })

    await usuario.type(await screen.findByPlaceholderText(/tu nombre de usuario/i), 'maria')
    await usuario.type(screen.getByPlaceholderText(/ingresa tu contraseña/i), 'clave-segura-123')
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    expect(await screen.findByRole('heading', { name: /nuevo espacio para sus talentos/i })).toBeInTheDocument()
    expect(screen.getAllByText(/María López|Padre \/ acudiente/).length).toBeGreaterThan(0)
  })

  it('muestra un mensaje cuando las credenciales son incorrectas', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuesta(401, { detail: 'No active account' }))
    const usuario = userEvent.setup()
    renderizar('/acceso', { modoDemo: false, fetchImpl: fetchFalso as unknown as typeof fetch })

    await usuario.type(await screen.findByPlaceholderText(/tu nombre de usuario/i), 'maria')
    await usuario.type(screen.getByPlaceholderText(/ingresa tu contraseña/i), 'mala')
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    expect(await screen.findByText(/no pudimos iniciar sesión/i)).toBeInTheDocument()
  })

  it('avisa del bloqueo temporal tras demasiados intentos', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuesta(429, { detail: 'bloqueado' }))
    const usuario = userEvent.setup()
    renderizar('/acceso', { modoDemo: false, fetchImpl: fetchFalso as unknown as typeof fetch })

    await usuario.type(await screen.findByPlaceholderText(/tu nombre de usuario/i), 'maria')
    await usuario.type(screen.getByPlaceholderText(/ingresa tu contraseña/i), 'x')
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    expect(await screen.findByText(/demasiados intentos fallidos/i)).toBeInTheDocument()
  })

  it('al recargar con un refresh guardado recupera la sesión', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_refresh', 'R1')
    const fetchFalso = vi.fn((url: string, opciones: RequestInit) => {
      if (url.endsWith('/auth/token/refresh/')) return Promise.resolve(respuesta(200, { access: 'A2', refresh: 'R2' }))
      const autorizado = (opciones.headers as Record<string, string>).Authorization === 'Bearer A2'
      return Promise.resolve(autorizado && url.endsWith('/auth/perfil/') ? respuesta(200, perfil) : respuesta(401))
    })
    renderizar('/familias/matricula', { modoDemo: false, almacenamiento, fetchImpl: fetchFalso as unknown as typeof fetch })

    expect(await screen.findByRole('heading', { name: /nuevo espacio para sus talentos/i })).toBeInTheDocument()
    expect(almacenamiento.leer('nj_refresh')).toBe('R2')
  })
})
