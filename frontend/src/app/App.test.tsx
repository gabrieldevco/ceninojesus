import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AlmacenamientoMemoria } from '@/shared/lib/almacenamiento'
import { CONTENIDO_POR_DEFECTO } from '@/modules/institucional'
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

  it('un visitante escribe desde el inicio: valida la autorización y luego agradece', async () => {
    const usuario = userEvent.setup()
    renderizar('/', { modoDemo: true })

    const formulario = await screen.findByRole('form', { name: /formulario de contacto/i })
    const dentro = within(formulario)
    await usuario.type(dentro.getByLabelText(/nombre/i), 'Marta Gómez')
    await usuario.type(dentro.getByLabelText(/correo/i), 'marta@example.com')
    await usuario.type(dentro.getByLabelText(/asunto/i), 'Horarios')
    await usuario.type(dentro.getByLabelText(/^mensaje/i), '¿Cuál es el horario?')
    await usuario.click(dentro.getByRole('button', { name: /enviar mensaje/i }))
    expect(await dentro.findByRole('alert')).toHaveTextContent(/autorizar el tratamiento/i)

    await usuario.click(dentro.getByRole('checkbox'))
    await usuario.click(dentro.getByRole('button', { name: /enviar mensaje/i }))

    expect(await screen.findByRole('heading', { name: /gracias por escribirnos/i })).toBeInTheDocument()
  })

  it('la política de datos es pública', async () => {
    renderizar('/politica-de-datos', { modoDemo: true })
    expect(await screen.findByRole('heading', { name: /política de tratamiento de datos/i })).toBeInTheDocument()
    expect(await screen.findByText(/de demostración/i)).toBeInTheDocument()
  })

  it('un visitante crea su cuenta de acudiente: valida y lo lleva a iniciar sesión', async () => {
    const usuario = userEvent.setup()
    renderizar('/registro', { modoDemo: true })
    const formulario = await screen.findByRole('form', { name: /crear cuenta/i })
    const [nombres, apellidos, correo, , usuarioIngresado, clave, confirmacion] = Array.from(formulario.querySelectorAll('input'))

    await usuario.type(nombres as HTMLElement, 'Ana')
    await usuario.type(apellidos as HTMLElement, 'Gómez')
    await usuario.type(correo as HTMLElement, 'ana@example.com')
    await usuario.type(usuarioIngresado as HTMLElement, 'ana')
    await usuario.type(clave as HTMLElement, 'Clave-segura-1')
    await usuario.type(confirmacion as HTMLElement, 'Clave-segura-1')
    await usuario.click(within(formulario).getByRole('button', { name: /crear cuenta/i }))
    expect(await within(formulario).findByRole('alert')).toHaveTextContent(/autorizar el tratamiento/i)

    await usuario.click(within(formulario).getByRole('checkbox'))
    await usuario.click(within(formulario).getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('el enlace del correo lleva a crear una contraseña nueva', async () => {
    const usuario = userEvent.setup()
    renderizar('/restablecer-contrasena?uid=Mw&token=abc-123', { modoDemo: true })
    const formulario = await screen.findByRole('form', { name: /restablecer contraseña/i })
    const [clave, confirmacion] = Array.from(formulario.querySelectorAll('input'))

    await usuario.type(clave as HTMLElement, 'corta')
    await usuario.type(confirmacion as HTMLElement, 'corta')
    await usuario.click(within(formulario).getByRole('button', { name: /cambiar contraseña/i }))
    expect(await within(formulario).findByRole('alert')).toHaveTextContent(/8 caracteres/)

    await usuario.clear(clave as HTMLElement)
    await usuario.clear(confirmacion as HTMLElement)
    await usuario.type(clave as HTMLElement, 'Clave-segura-1')
    await usuario.type(confirmacion as HTMLElement, 'Clave-segura-1')
    await usuario.click(within(formulario).getByRole('button', { name: /cambiar contraseña/i }))

    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('un enlace de restablecimiento incompleto avisa y ofrece volver', async () => {
    renderizar('/restablecer-contrasena', { modoDemo: true })
    expect(await screen.findByRole('alert')).toHaveTextContent(/enlace está incompleto/i)
    expect(screen.getByRole('link', { name: /volver a iniciar sesión/i })).toBeInTheDocument()
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

  it('el administrador general gestiona cuentas: crea una, cambia su rol y anonimiza; la suya no se toca', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup()
    renderizar('/admin/usuarios', { modoDemo: true, almacenamiento })

    // Su propia cuenta no se puede desactivar ni cambiar de rol
    const propia = (await screen.findByText('general')).closest('tr') as HTMLElement
    expect(within(propia).getByRole('combobox')).toBeDisabled()
    expect(within(propia).getByRole('button', { name: /desactivar/i })).toBeDisabled()

    const formulario = screen.getByRole('form', { name: /crear cuenta/i })
    await usuario.click(within(formulario).getByRole('button', { name: /crear cuenta/i }))
    expect(await within(formulario).findAllByRole('alert')).toHaveLength(2)

    await usuario.type(within(formulario).getByLabelText(/^usuario/i), 'profe.nuevo')
    await usuario.type(within(formulario).getByLabelText(/contraseña inicial/i), 'clave-segura-123')
    await usuario.click(within(formulario).getByRole('button', { name: /crear cuenta/i }))
    const fila = (await screen.findByText('profe.nuevo')).closest('tr') as HTMLElement

    await usuario.selectOptions(within(fila).getByRole('combobox'), 'acudiente')
    await waitFor(() => expect(within(fila).getByRole('combobox')).toHaveValue('acudiente'))

    await usuario.click(within(fila).getByRole('button', { name: /anonimizar/i }))
    await usuario.click(within(fila).getByRole('button', { name: /confirmar/i }))
    expect(await screen.findByText('anonimo-100')).toBeInTheDocument()
  })

  it('el administrador general crea un grupo y asigna a quien lo administra', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup()
    renderizar('/admin/usuarios', { modoDemo: true, almacenamiento })

    await usuario.click(await screen.findByRole('tab', { name: /grupos/i }))
    const formulario = await screen.findByRole('form', { name: /crear grupo/i })
    await usuario.type(within(formulario).getByLabelText(/cupo máximo/i), '0')
    await usuario.click(within(formulario).getByRole('button', { name: /crear grupo/i }))
    expect((await within(formulario).findAllByRole('alert')).length).toBeGreaterThan(0)

    await usuario.type(within(formulario).getByLabelText(/^nombre/i), 'Danza')
    await usuario.clear(within(formulario).getByLabelText(/cupo máximo/i))
    await usuario.click(within(formulario).getByRole('button', { name: /crear grupo/i }))

    const tarjeta = await screen.findByRole('article', { name: 'Grupo Danza' })
    await usuario.click(await within(tarjeta).findByRole('checkbox', { name: /admin robótica/i }))
    await waitFor(() => expect(within(tarjeta).getByRole('checkbox', { name: /admin robótica/i })).toBeChecked())
  })

  it('en modo demostración el portal lo avisa y ofrece la biblioteca de ejemplo', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'padre')
    renderizar('/familias/matricula', { modoDemo: true, almacenamiento })

    expect(await screen.findByText('Demostración')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /biblioteca/i })).toHaveAttribute('href', 'https://biblioteca.example.com')
  })

  it('un titular radica una solicitud sobre sus datos: valida y luego confirma', async () => {
    const usuario = userEvent.setup()
    renderizar('/solicitud-de-datos', { modoDemo: true })

    const formulario = await screen.findByRole('form', { name: /solicitud sobre datos personales/i })
    const dentro = within(formulario)
    await usuario.click(dentro.getByRole('button', { name: /radicar solicitud/i }))
    expect((await dentro.findAllByRole('alert')).length).toBe(3)

    await usuario.selectOptions(dentro.getByRole('combobox'), 'supresion')
    await usuario.type(dentro.getByLabelText(/^nombre/i), 'Marta Gómez')
    await usuario.type(dentro.getByLabelText(/correo/i), 'marta@example.com')
    await usuario.type(dentro.getByLabelText(/cuéntanos/i), 'Quiero que borren mis datos')
    await usuario.click(dentro.getByRole('button', { name: /radicar solicitud/i }))

    expect(await screen.findByRole('heading', { name: /recibimos tu solicitud/i })).toBeInTheDocument()
  })

  it('el administrador general atiende una solicitud de datos: la marca en trámite y la responde', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup()
    renderizar('/admin/datos-personales', { modoDemo: true, almacenamiento })

    // Las vencidas se señalan
    expect(await screen.findByText('Vencida')).toBeInTheDocument()

    await usuario.click(await screen.findByRole('cell', { name: /laura pérez/i }))
    await usuario.click(await screen.findByRole('button', { name: /marcar en trámite/i }))
    await waitFor(() => expect(screen.queryByRole('button', { name: /marcar en trámite/i })).not.toBeInTheDocument())

    await usuario.click(screen.getByRole('button', { name: /responder y cerrar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/escribe la respuesta/i)

    await usuario.type(screen.getByPlaceholderText(/se le enviará por correo/i), 'Eliminamos sus datos de nuestros registros.')
    await usuario.click(screen.getByRole('button', { name: /responder y cerrar/i }))
    expect(await screen.findByText('Eliminamos sus datos de nuestros registros.')).toBeInTheDocument()
  })

  it('la página de inicio muestra el contenido que administra la institución', async () => {
    renderizar('/', { modoDemo: true })

    expect(await screen.findByRole('heading', { name: /aprende y crece/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cuerpo directivo' })).toBeInTheDocument()
    expect(screen.getByText('Miryam Junco Martínez')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /actividades escolares/i })).toHaveAttribute('src', '/img/hero-colegio.jpg')
    expect(screen.getAllByText(/334 4105/).length).toBeGreaterThan(0)
  })

  it('si el servidor no responde, la página de inicio sigue mostrando su contenido', async () => {
    const fetchFalso = vi.fn(() => Promise.resolve(respuesta(500, { detail: 'error' })))
    renderizar('/', { modoDemo: false, apiUrl: '/api', fetchImpl: fetchFalso as unknown as typeof fetch })

    expect(await screen.findByRole('heading', { name: /aprende y crece/i })).toBeInTheDocument()
    expect(screen.getByText('Miryam Junco Martínez')).toBeInTheDocument()
  })

  it('la página de inicio muestra lo que dice la API y oculta las secciones sin elementos', async () => {
    const { informacion } = CONTENIDO_POR_DEFECTO
    const api = {
      nombre: informacion.nombre,
      historia: '',
      mision: 'Misión oficial del colegio.',
      vision: '',
      direccion: 'Carrera 5 # 6-7',
      ciudad: 'Soledad',
      telefonos: '300 123 4567',
      correo: 'info@colegio.co',
      horario_atencion: 'Lunes a viernes, 7 a. m.',
      url_mapa: '',
      url_facebook: '',
      politica_tratamiento_datos: '',
      portada_etiqueta: 'ETIQUETA NUEVA',
      portada_titulo: 'Aprendemos',
      portada_destacado: 'juntos todos los días.',
      portada_texto: 'Texto nuevo.',
      quienes_principal: 'Principal.',
      quienes_secundario: 'Secundario.',
      enfoque_titulo: 'Enfoque nuevo',
      enfoque_texto: 'Texto del enfoque.',
      enfoque_pasos: 'Uno, Dos',
      enfoque_nota: 'Nota.',
      horizonte_pendiente_validacion: false,
      contacto_titulo: 'Escríbenos',
      contacto_texto: 'Contacto.',
      pie_descripcion: 'Pie nuevo.',
    }
    const valor = { id: 1, seccion: 'valor', titulo: 'Respeto', texto: 'Convivir', detalle: '', icono: '🙏', imagen: '', tiene_imagen_subida: false, orden: 0, activo: true }
    const portada = { id: 2, seccion: 'imagen_portada', titulo: '', texto: 'Foto del colegio', detalle: '', icono: '', imagen: '/api/institucional/elementos/2/imagen/?v=1', tiene_imagen_subida: true, orden: 0, activo: true }
    const fetchFalso = vi.fn((url: string) => {
      if (url.endsWith('/institucional/')) return Promise.resolve(respuesta(200, api))
      if (url.endsWith('/institucional/elementos/')) return Promise.resolve(respuesta(200, [valor, portada]))
      return Promise.resolve(respuesta(404))
    })
    renderizar('/', { modoDemo: false, apiUrl: '/api', fetchImpl: fetchFalso as unknown as typeof fetch })

    expect(await screen.findByRole('heading', { name: /juntos todos los días/i })).toBeInTheDocument()
    expect(screen.getByText('Respeto')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Foto del colegio' })).toHaveAttribute('src', '/api/institucional/elementos/2/imagen/?v=1')
    expect(screen.getAllByText('Carrera 5 # 6-7, Soledad').length).toBeGreaterThan(0)
    expect(screen.getByText('Lunes a viernes, 7 a. m.')).toBeInTheDocument()
    // Sin cuerpo directivo, ofertas ni galería, esas secciones no aparecen
    expect(screen.queryByRole('heading', { name: 'Cuerpo directivo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Lo que ofrecemos' })).not.toBeInTheDocument()
    // Con la validación hecha, desaparece el aviso de textos propuestos; solo queda la misión
    expect(screen.queryByText(/pendientes de validación/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Misión' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Historia' })).not.toBeInTheDocument()
  })

  it('el administrador general cambia un texto y la página de inicio lo muestra', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup()
    renderizar('/admin/sitio', { modoDemo: true, almacenamiento })

    const portada = within(await screen.findByRole('group', { name: 'Portada' }))
    const titulo = portada.getByLabelText('Título')
    await usuario.clear(titulo)
    await usuario.type(titulo, 'Aprendemos siempre')
    await usuario.click(screen.getByRole('button', { name: /guardar textos/i }))
    expect(await screen.findByText(/textos guardados/i)).toBeInTheDocument()

    await usuario.click(screen.getByRole('link', { name: /volver al sitio web/i }))
    expect(await screen.findByRole('heading', { name: /aprendemos siempre aprende y crece/i })).toBeInTheDocument()
  })

  it('el administrador general agrega, oculta y elimina elementos de las listas', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup()
    renderizar('/admin/sitio', { modoDemo: true, almacenamiento })

    await usuario.click(await screen.findByRole('tab', { name: /listas y fotos/i }))
    const valores = within(await screen.findByRole('region', { name: 'Valores' }))

    await usuario.click(valores.getByRole('button', { name: 'Agregar' }))
    const formulario = within(await screen.findByRole('form', { name: /agregar a valores/i }))
    await usuario.click(formulario.getByRole('button', { name: 'Agregar' }))
    expect(await formulario.findByRole('alert')).toHaveTextContent(/escribe: valor/i)

    await usuario.type(formulario.getByLabelText(/^valor/i), 'Respeto')
    await usuario.type(formulario.getByLabelText(/emoji/i), '🙏')
    await usuario.click(formulario.getByRole('button', { name: 'Agregar' }))
    const fila = await valores.findByRole('listitem', { name: 'Respeto' })

    await usuario.click(within(valores.getByRole('listitem', { name: 'Liderazgo' })).getByRole('button', { name: 'Ocultar' }))
    await usuario.click(within(valores.getByRole('listitem', { name: 'Autonomía' })).getByRole('button', { name: 'Eliminar' }))
    await usuario.click(within(valores.getByRole('listitem', { name: 'Autonomía' })).getByRole('button', { name: /confirmar eliminación/i }))
    await waitFor(() => expect(valores.queryByRole('listitem', { name: 'Autonomía' })).not.toBeInTheDocument())
    expect(fila).toBeInTheDocument()

    await usuario.click(screen.getByRole('link', { name: /volver al sitio web/i }))
    const seccion = within((await screen.findByRole('heading', { name: 'Valores que se viven cada día' })).closest('section') as HTMLElement)
    expect(await seccion.findByText('Respeto')).toBeInTheDocument()
    expect(seccion.queryByText('Liderazgo')).not.toBeInTheDocument()
    expect(seccion.queryByText('Autonomía')).not.toBeInTheDocument()
  })

  it('el administrador general cambia la foto de la portada; solo admite imágenes', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup({ applyAccept: false })
    renderizar('/admin/sitio', { modoDemo: true, almacenamiento })

    await usuario.click(await screen.findByRole('tab', { name: /imágenes principales/i }))
    const entrada = await screen.findByLabelText('Archivo para Foto de la portada')

    await usuario.upload(entrada, new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' }))
    expect(await screen.findByText(/debe ser jpg o png/i)).toBeInTheDocument()

    await usuario.upload(entrada, new File([new Uint8Array([1])], 'foto.png', { type: 'image/png' }))
    expect(await screen.findByText(/imagen actualizada/i)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /volver a la original/i })).toBeInTheDocument()
  })

  it('el administrador general administra los enlaces del portal: rechaza direcciones inseguras', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'general')
    const usuario = userEvent.setup()
    renderizar('/admin/sitio', { modoDemo: true, almacenamiento })

    await usuario.click(await screen.findByRole('tab', { name: /^enlaces$/i }))
    await usuario.click(await screen.findByRole('button', { name: /agregar enlace/i }))
    const formulario = within(await screen.findByRole('form', { name: /agregar enlace/i }))

    await usuario.type(formulario.getByLabelText(/^nombre/i), 'Notas')
    await usuario.type(formulario.getByLabelText(/dirección/i), 'javascript:alert(1)')
    await usuario.click(formulario.getByRole('button', { name: /guardar enlace/i }))
    expect(await formulario.findByRole('alert')).toHaveTextContent(/https/i)

    await usuario.clear(formulario.getByLabelText(/dirección/i))
    await usuario.type(formulario.getByLabelText(/dirección/i), 'https://notas.colegio.co')
    await usuario.click(formulario.getByRole('button', { name: /guardar enlace/i }))
    expect(await screen.findByRole('listitem', { name: 'Notas' })).toBeInTheDocument()
  })

  it('un acudiente no entra al editor del sitio', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'padre')
    renderizar('/admin/sitio', { modoDemo: true, almacenamiento })

    expect(await screen.findByRole('heading', { name: /nuevo espacio para sus talentos/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /contenido de la página de inicio/i })).not.toBeInTheDocument()
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

  it('el portal muestra la biblioteca que define la institución y no rotula la sesión como demostración', async () => {
    const enlace = { id: 1, nombre: 'Biblioteca', url: 'https://biblioteca.colegio.co', tipo: 'biblioteca', descripcion: '' }
    const fetchFalso = vi.fn((url: string) => {
      if (url.endsWith('/auth/token/')) return Promise.resolve(respuesta(200, { access: 'A', refresh: 'R' }))
      if (url.endsWith('/auth/perfil/')) return Promise.resolve(respuesta(200, perfil))
      if (url.endsWith('/institucional/enlaces/')) return Promise.resolve(respuesta(200, [enlace]))
      return Promise.resolve(respuesta(404))
    })
    const usuario = userEvent.setup()
    renderizar('/acceso', { modoDemo: false, apiUrl: '/api', fetchImpl: fetchFalso as unknown as typeof fetch })

    await usuario.type(await screen.findByPlaceholderText(/tu nombre de usuario/i), 'maria')
    await usuario.type(screen.getByPlaceholderText(/ingresa tu contraseña/i), 'clave-segura-123')
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    const biblioteca = await screen.findByRole('link', { name: /biblioteca/i })
    expect(biblioteca).toHaveAttribute('href', 'https://biblioteca.colegio.co')
    expect(screen.queryByText('Demostración')).not.toBeInTheDocument()
  })

  it('sin biblioteca configurada, el portal no ofrece un enlace muerto', async () => {
    const fetchFalso = vi.fn((url: string) => {
      if (url.endsWith('/auth/token/')) return Promise.resolve(respuesta(200, { access: 'A', refresh: 'R' }))
      if (url.endsWith('/auth/perfil/')) return Promise.resolve(respuesta(200, perfil))
      if (url.endsWith('/institucional/enlaces/')) return Promise.resolve(respuesta(200, []))
      return Promise.resolve(respuesta(404))
    })
    const usuario = userEvent.setup()
    renderizar('/acceso', { modoDemo: false, apiUrl: '/api', fetchImpl: fetchFalso as unknown as typeof fetch })

    await usuario.type(await screen.findByPlaceholderText(/tu nombre de usuario/i), 'maria')
    await usuario.type(screen.getByPlaceholderText(/ingresa tu contraseña/i), 'clave-segura-123')
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    await screen.findByRole('heading', { name: /nuevo espacio para sus talentos/i })
    await waitFor(() => expect(fetchFalso).toHaveBeenCalledWith(expect.stringContaining('/institucional/enlaces/'), expect.anything()))
    expect(screen.queryByRole('link', { name: /biblioteca/i })).not.toBeInTheDocument()
  })

  it('muestra un mensaje cuando las credenciales son incorrectas', async () => {
    const fetchFalso = vi.fn(() => Promise.resolve(respuesta(401, { detail: 'No active account' })))
    const usuario = userEvent.setup()
    renderizar('/acceso', { modoDemo: false, fetchImpl: fetchFalso as unknown as typeof fetch })

    await usuario.type(await screen.findByPlaceholderText(/tu nombre de usuario/i), 'maria')
    await usuario.type(screen.getByPlaceholderText(/ingresa tu contraseña/i), 'mala')
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    expect(await screen.findByText(/no pudimos iniciar sesión/i)).toBeInTheDocument()
  })

  it('avisa del bloqueo temporal tras demasiados intentos', async () => {
    const fetchFalso = vi.fn(() => Promise.resolve(respuesta(429, { detail: 'bloqueado' })))
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
