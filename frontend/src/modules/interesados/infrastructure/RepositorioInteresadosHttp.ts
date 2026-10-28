import type { HttpClient } from '@/shared/http/HttpClient'
import type { NuevoInteresado } from '../domain/interesado'
import type { RepositorioInteresados } from '../domain/puertos'

export class RepositorioInteresadosHttp implements RepositorioInteresados {
  constructor(private readonly http: HttpClient) {}

  async registrar(nuevo: NuevoInteresado): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: '/interesados/',
      autenticada: false,
      cuerpo: {
        nombre_completo: nuevo.nombreCompleto,
        correo: nuevo.correo,
        telefono: nuevo.telefono,
        nombre_aspirante: nuevo.nombreAspirante,
        grado_interes: nuevo.gradoInteres,
        mensaje: nuevo.mensaje,
        autoriza_tratamiento_datos: nuevo.autorizaTratamientoDatos,
      },
    })
  }
}
