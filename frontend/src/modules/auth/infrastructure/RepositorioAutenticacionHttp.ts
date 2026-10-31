import { z } from 'zod'
import { ErrorApi, NoAutorizado } from '@/shared/http/errores'
import type { HttpClient } from '@/shared/http/HttpClient'
import { DemasiadosIntentos, type RepositorioAutenticacion } from '../domain/puertos'
import type { NuevoAcudiente, RestablecimientoDeClave } from '../domain/registro'
import { crearUsuario, ROLES, type Usuario } from '../domain/usuario'
import type { GestorDeSesion } from './GestorDeSesion'

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const TokensDto = z.object({ access: z.string(), refresh: z.string() })
const PerfilDto = z.object({
  id: z.number(),
  nombre_usuario: z.string(),
  nombres: z.string(),
  apellidos: z.string(),
  rol: z.enum(ROLES as [string, ...string[]]),
})

export class RepositorioAutenticacionHttp implements RepositorioAutenticacion {
  constructor(
    private readonly http: HttpClient,
    private readonly sesion: GestorDeSesion,
  ) {}

  async iniciarSesion(identificador: string, clave: string): Promise<Usuario | null> {
    let tokens
    try {
      tokens = TokensDto.parse(
        await this.http.enviar({
          metodo: 'POST',
          ruta: '/auth/token/',
          cuerpo: { nombre_usuario: identificador, password: clave },
          autenticada: false,
        }),
      )
    } catch (error) {
      if (error instanceof ErrorApi && error.estado === 401) return null
      if (error instanceof ErrorApi && error.estado === 429) throw new DemasiadosIntentos()
      throw error
    }
    this.sesion.guardar(tokens)
    return this.cargarPerfil()
  }

  async obtenerSesion(): Promise<Usuario | null> {
    if (!this.sesion.refresco()) return null
    try {
      // Sin token de acceso en memoria (recarga de página), la primera petición lo renueva sola
      return await this.cargarPerfil()
    } catch (error) {
      if (error instanceof NoAutorizado) return null
      throw error
    }
  }

  async cerrarSesion(): Promise<void> {
    const refresh = this.sesion.refresco()
    this.sesion.limpiar()
    if (!refresh) return
    try {
      await this.http.enviar({ metodo: 'POST', ruta: '/auth/logout/', cuerpo: { refresh }, autenticada: false })
    } catch {
      /* si falla, el refresh igual vence solo; la sesión local ya está cerrada */
    }
  }

  async solicitarRecuperacion(identificador: string): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: '/auth/recuperar/',
      cuerpo: { identificador },
      autenticada: false,
    })
  }

  async registrarAcudiente(nuevo: NuevoAcudiente): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: '/auth/registro/',
      autenticada: false,
      cuerpo: {
        nombre_usuario: nuevo.nombreUsuario,
        password: nuevo.clave,
        nombres: nuevo.nombres,
        apellidos: nuevo.apellidos,
        correo: nuevo.correo,
        telefono: nuevo.telefono,
        autoriza_tratamiento_datos: nuevo.autorizaTratamientoDatos,
      },
    })
  }

  async restablecerClave(datos: RestablecimientoDeClave): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: '/auth/recuperar/confirmar/',
      autenticada: false,
      cuerpo: { uid: datos.uid, token: datos.token, password: datos.clave },
    })
  }

  private async cargarPerfil(): Promise<Usuario> {
    const perfil = PerfilDto.parse(await this.http.enviar({ metodo: 'GET', ruta: '/auth/perfil/' }))
    return crearUsuario({
      id: perfil.id,
      identificador: perfil.nombre_usuario,
      nombres: perfil.nombres,
      apellidos: perfil.apellidos,
      rol: perfil.rol as Usuario['rol'],
    })
  }
}
