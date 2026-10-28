import { AlmacenamientoMemoria } from '@/shared/lib/almacenamiento'
import { CLAVE_DEMO, RepositorioAutenticacionDemo } from './RepositorioAutenticacionDemo'

describe('RepositorioAutenticacionDemo', () => {
  it('inicia sesión con una cuenta de demostración y la recuerda', async () => {
    const almacenamiento = new AlmacenamientoMemoria()
    const usuario = await new RepositorioAutenticacionDemo(almacenamiento).iniciarSesion('padre', CLAVE_DEMO)
    expect(usuario).toMatchObject({ rol: 'acudiente', nombre: 'Acudiente demo A', inicio: '/familias/matricula' })

    const otraInstancia = new RepositorioAutenticacionDemo(almacenamiento)
    expect((await otraInstancia.obtenerSesion())?.identificador).toBe('padre')
  })

  it('rechaza clave incorrecta o cuenta inexistente sin guardar sesión', async () => {
    const repo = new RepositorioAutenticacionDemo(new AlmacenamientoMemoria())
    expect(await repo.iniciarSesion('padre', 'mala')).toBeNull()
    expect(await repo.iniciarSesion('nadie', CLAVE_DEMO)).toBeNull()
    expect(await repo.obtenerSesion()).toBeNull()
  })

  it('cierra la sesión', async () => {
    const repo = new RepositorioAutenticacionDemo(new AlmacenamientoMemoria())
    await repo.iniciarSesion('admin', CLAVE_DEMO)
    await repo.cerrarSesion()
    expect(await repo.obtenerSesion()).toBeNull()
  })
})
