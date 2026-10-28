import { AlmacenamientoMemoria } from '@/shared/lib/almacenamiento'
import { CLAVE_DEMO, RepositorioAutenticacionDemo } from './RepositorioAutenticacionDemo'

describe('RepositorioAutenticacionDemo', () => {
  it('inicia sesión con una cuenta de demostración y la recuerda', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    const usuario = await new RepositorioAutenticacionDemo(almacenamiento).iniciarSesion('padre@demo.com', CLAVE_DEMO)
    expect(usuario?.rol).toBe('padre')

    const otraInstancia = new RepositorioAutenticacionDemo(almacenamiento)
    expect((await otraInstancia.obtenerSesion())?.correo).toBe('padre@demo.com')
  })

  it('rechaza clave incorrecta o cuenta inexistente sin guardar sesión', async () => {
    const repo = new RepositorioAutenticacionDemo(new AlmacenamientoMemoria())
    expect(await repo.iniciarSesion('padre@demo.com', 'mala')).toBeNull()
    expect(await repo.iniciarSesion('nadie@demo.com', CLAVE_DEMO)).toBeNull()
    expect(await repo.obtenerSesion()).toBeNull()
  })

  it('cierra la sesión', async () => {
    const repo = new RepositorioAutenticacionDemo(new AlmacenamientoMemoria())
    await repo.iniciarSesion('admin@demo.com', CLAVE_DEMO)
    await repo.cerrarSesion()
    expect(await repo.obtenerSesion()).toBeNull()
  })
})
