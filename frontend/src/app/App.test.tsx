import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AlmacenamientoMemoria } from '@/shared/lib/almacenamiento'
import App from './App'
import { Proveedores } from './Proveedores'

function renderizar(ruta: string, almacenamiento = new AlmacenamientoMemoria()) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Proveedores almacenamiento={almacenamiento}>
        <App />
      </Proveedores>
    </MemoryRouter>,
  )
}

describe('aplicación', () => {
  it('sin sesión, un área restringida lleva al inicio de sesión', async () => {
    renderizar('/familias/matricula')
    expect(await screen.findByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('un acudiente inicia sesión y ve su matrícula extracurricular', async () => {
    const usuario = userEvent.setup()
    renderizar('/acceso')

    await usuario.click(await screen.findByRole('tab', { name: /acudiente/i }))
    await usuario.click(screen.getByRole('button', { name: /ingresar al portal/i }))

    expect(await screen.findByRole('heading', { name: /nuevo espacio para sus talentos/i })).toBeInTheDocument()
    expect(screen.getByText('Mis solicitudes')).toBeInTheDocument()
  })

  it('un estudiante no puede entrar a las solicitudes de administración', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    almacenamiento.guardar('nj_user', 'estudiante@demo.com')
    renderizar('/admin/solicitudes', almacenamiento)

    await waitFor(() => expect(screen.getByRole('heading', { name: /aprende, explora y participa/i })).toBeInTheDocument())
  })
})
