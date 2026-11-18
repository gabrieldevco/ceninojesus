import { enviarAHojaDeCalculo } from '@/shared/formularios/enviarAHojaDeCalculo'
import type { NuevoInteresado } from '../domain/interesado'
import { RepositorioInteresadosDemo } from './RepositorioInteresadosDemo'

/** Sitio sin backend: el formulario de admisiones llega a la hoja de cálculo de la institución. */
export class RepositorioInteresadosHoja extends RepositorioInteresadosDemo {
  constructor(
    private readonly url: string,
    private readonly fetchImpl?: typeof fetch,
  ) {
    super()
  }

  override async registrar(nuevo: NuevoInteresado): Promise<void> {
    await enviarAHojaDeCalculo(
      this.url,
      'admisiones',
      {
        acudiente: nuevo.nombreCompleto,
        telefono: nuevo.telefono,
        correo: nuevo.correo,
        aspirante: nuevo.nombreAspirante,
        grado: nuevo.gradoInteres,
        mensaje: nuevo.mensaje,
        autorizaDatos: nuevo.autorizaTratamientoDatos,
      },
      this.fetchImpl,
    )
  }
}
