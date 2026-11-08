import type { Enlace, MensajeContactoRecibido, NuevoMensaje, PoliticaDeDatos } from '../domain/contacto'
import type { RepositorioInstitucional } from '../domain/puertos'

/** Modo sin backend: acepta el mensaje sin guardarlo y muestra una política de ejemplo. */
export class RepositorioInstitucionalDemo implements RepositorioInstitucional {
  private mensajes: MensajeContactoRecibido[] = [
    {
      id: 1,
      nombre: 'Carolina Herrera',
      correo: 'carolina.herrera@gmail.com',
      telefono: '300 1234567',
      asunto: 'Consulta sobre admisiones para transición',
      mensaje: 'Buenas tardes, quisiera información sobre los costos de matrícula y el horario de atención para conocer las instalaciones del colegio.',
      autorizaTratamientoDatos: true,
      leido: false,
      fechaEnvio: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 2,
      nombre: 'Jorge Mendoza',
      correo: 'jorge.mendoza@hotmail.com',
      telefono: '315 9876543',
      asunto: 'Horarios de grupos extracurriculares',
      mensaje: 'Hola, me gustaría saber si el grupo de robótica tiene cupos disponibles para el próximo mes y qué días son las clases.',
      autorizaTratamientoDatos: true,
      leido: true,
      fechaEnvio: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]

  enviarMensaje(nuevo: NuevoMensaje): Promise<void> {
    const id = Math.max(0, ...this.mensajes.map((m) => m.id)) + 1
    this.mensajes.unshift({
      id,
      nombre: nuevo.nombre,
      correo: nuevo.correo,
      telefono: nuevo.telefono,
      asunto: nuevo.asunto,
      mensaje: nuevo.mensaje,
      autorizaTratamientoDatos: nuevo.autorizaTratamientoDatos,
      leido: false,
      fechaEnvio: new Date().toISOString(),
    })
    return Promise.resolve()
  }

  listarEnlaces(): Promise<Enlace[]> {
    return Promise.resolve([
      { id: 1, nombre: 'Biblioteca', url: 'https://biblioteca.example.com', tipo: 'biblioteca', descripcion: 'Biblioteca de demostración' },
    ])
  }

  politicaDeDatos(): Promise<PoliticaDeDatos> {
    return Promise.resolve({
      texto: 'Política de tratamiento de datos de demostración.\n\nEl texto real lo publica la institución.',
      correo: 'ce_nino@hotmail.com',
    })
  }

  listarMensajesContacto(soloNoLeidos = false): Promise<MensajeContactoRecibido[]> {
    const res = soloNoLeidos ? this.mensajes.filter((m) => !m.leido) : [...this.mensajes]
    return Promise.resolve(res)
  }

  marcarMensajeContactoLeido(id: number): Promise<void> {
    const item = this.mensajes.find((m) => m.id === id)
    if (item) item.leido = true
    return Promise.resolve()
  }
}
