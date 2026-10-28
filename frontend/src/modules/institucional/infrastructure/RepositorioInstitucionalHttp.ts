import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { NuevoMensaje, PoliticaDeDatos } from '../domain/contacto'
import type { RepositorioInstitucional } from '../domain/puertos'

const PoliticaDto = z.object({
  politica: z.string().nullish().transform((v) => v ?? ''),
  correo: z.string().nullish().transform((v) => v ?? ''),
})

export class RepositorioInstitucionalHttp implements RepositorioInstitucional {
  constructor(private readonly http: HttpClient) {}

  async enviarMensaje(nuevo: NuevoMensaje): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: '/institucional/contacto/',
      autenticada: false,
      cuerpo: {
        nombre: nuevo.nombre,
        correo: nuevo.correo,
        telefono: nuevo.telefono,
        asunto: nuevo.asunto,
        mensaje: nuevo.mensaje,
        autoriza_tratamiento_datos: nuevo.autorizaTratamientoDatos,
      },
    })
  }

  async politicaDeDatos(): Promise<PoliticaDeDatos> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/institucional/politica-datos/', autenticada: false })
    const dto = PoliticaDto.parse(datos)
    return { texto: dto.politica, correo: dto.correo }
  }
}
