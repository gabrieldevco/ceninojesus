import type { PoliticaDeDatos } from '../domain/contacto'
import type { RepositorioInstitucional } from '../domain/puertos'

/** Modo sin backend: acepta el mensaje sin guardarlo y muestra una política de ejemplo. */
export class RepositorioInstitucionalDemo implements RepositorioInstitucional {
  enviarMensaje(): Promise<void> {
    return Promise.resolve()
  }

  politicaDeDatos(): Promise<PoliticaDeDatos> {
    return Promise.resolve({
      texto: 'Política de tratamiento de datos de demostración.\n\nEl texto real lo publica la institución.',
      correo: 'ce_nino@hotmail.com',
    })
  }
}
