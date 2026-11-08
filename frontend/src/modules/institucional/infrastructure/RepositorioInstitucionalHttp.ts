import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { Enlace, MensajeContactoRecibido, NuevoMensaje, PoliticaDeDatos } from '../domain/contacto'
import type { RepositorioInstitucional } from '../domain/puertos'

const PoliticaDto = z.object({
  politica: z.string().nullish().transform((v) => v ?? ''),
  correo: z.string().nullish().transform((v) => v ?? ''),
})

const EnlaceDto = z.object({
  id: z.number(),
  nombre: z.string(),
  url: z.string(),
  tipo: z.enum(['sistema_administrativo', 'biblioteca', 'otro']),
  descripcion: z.string().nullish().transform((v) => v ?? ''),
})

const MensajeDto = z.object({
  id: z.number(),
  nombre: z.string(),
  correo: z.string(),
  telefono: z.string().nullish().transform((v) => v ?? ''),
  asunto: z.string(),
  mensaje: z.string(),
  autoriza_tratamiento_datos: z.boolean(),
  leido: z.boolean(),
  fecha_envio: z.string(),
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

  async listarEnlaces(): Promise<Enlace[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/institucional/enlaces/' })
    return z.array(EnlaceDto).parse(datos)
  }

  async listarMensajesContacto(soloNoLeidos = false): Promise<MensajeContactoRecibido[]> {
    const ruta = soloNoLeidos ? '/institucional/contacto/?no_leidos=true' : '/institucional/contacto/'
    const datos = await this.http.enviar({ metodo: 'GET', ruta, autenticada: true })
    const lista = z.array(MensajeDto).parse(datos)
    return lista.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      correo: m.correo,
      telefono: m.telefono,
      asunto: m.asunto,
      mensaje: m.mensaje,
      autorizaTratamientoDatos: m.autoriza_tratamiento_datos,
      leido: m.leido,
      fechaEnvio: m.fecha_envio,
    }))
  }

  async marcarMensajeContactoLeido(id: number): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: `/institucional/contacto/${id}/leido/`,
      autenticada: true,
    })
  }
}
