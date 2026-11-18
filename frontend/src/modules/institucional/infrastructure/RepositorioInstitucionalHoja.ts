import { enviarAHojaDeCalculo } from '@/shared/formularios/enviarAHojaDeCalculo'
import type { NuevoMensaje } from '../domain/contacto'
import { RepositorioInstitucionalDemo } from './RepositorioInstitucionalDemo'

/** Sitio sin backend: el formulario de contacto llega a la hoja de cálculo de la institución. */
export class RepositorioInstitucionalHoja extends RepositorioInstitucionalDemo {
  constructor(
    private readonly url: string,
    private readonly fetchImpl?: typeof fetch,
  ) {
    super()
  }

  override async enviarMensaje(nuevo: NuevoMensaje): Promise<void> {
    await enviarAHojaDeCalculo(
      this.url,
      'contacto',
      {
        nombre: nuevo.nombre,
        telefono: nuevo.telefono,
        correo: nuevo.correo,
        asunto: nuevo.asunto,
        mensaje: nuevo.mensaje,
        autorizaDatos: nuevo.autorizaTratamientoDatos,
      },
      this.fetchImpl,
    )
  }
}
