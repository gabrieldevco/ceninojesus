import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import type { CambiosDeCuenta, CuentaDeUsuario, DatosDeGrupo, GrupoAdministrable, NuevaCuenta } from '../domain/administracion'
import type { RepositorioAdministracion } from '../domain/puertos'

/** Forma de las respuestas de la API: se valida en el borde antes de convertirlas en entidades. */
const UsuarioDto = z.object({
  id: z.number(),
  nombre_usuario: z.string(),
  rol: z.enum(['administrador', 'administrador_grupo', 'acudiente', 'estudiante']),
  correo: z.string().nullish().transform((v) => v ?? ''),
  nombres: z.string().nullish().transform((v) => v ?? ''),
  apellidos: z.string().nullish().transform((v) => v ?? ''),
  telefono: z.string().nullish().transform((v) => v ?? ''),
  activo: z.boolean(),
})
const GrupoDto = z.object({
  id: z.number(),
  nombre: z.string(),
  descripcion: z.string().nullish().transform((v) => v ?? ''),
  horario: z.string().nullish().transform((v) => v ?? ''),
  cupo_maximo: z.number().nullable().default(null),
  activo: z.boolean(),
  administrador_ids: z.array(z.number()).default([]),
})

const aCuenta = (dto: z.infer<typeof UsuarioDto>): CuentaDeUsuario => ({
  id: dto.id,
  nombreUsuario: dto.nombre_usuario,
  rol: dto.rol,
  correo: dto.correo,
  nombres: dto.nombres,
  apellidos: dto.apellidos,
  telefono: dto.telefono,
  activo: dto.activo,
})

const aGrupo = (dto: z.infer<typeof GrupoDto>): GrupoAdministrable => ({
  id: dto.id,
  nombre: dto.nombre,
  descripcion: dto.descripcion,
  horario: dto.horario,
  cupoMaximo: dto.cupo_maximo,
  activo: dto.activo,
  administradorIds: dto.administrador_ids,
})

const cuerpoDeGrupo = (datos: Partial<DatosDeGrupo>) => ({
  nombre: datos.nombre,
  descripcion: datos.descripcion,
  horario: datos.horario,
  cupo_maximo: datos.cupoMaximo,
  activo: datos.activo,
})

export class RepositorioAdministracionHttp implements RepositorioAdministracion {
  constructor(private readonly http: HttpClient) {}

  async listarUsuarios(): Promise<CuentaDeUsuario[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/usuarios/' })
    return z.array(UsuarioDto).parse(datos).map(aCuenta)
  }

  async crearUsuario(nueva: NuevaCuenta): Promise<CuentaDeUsuario> {
    const datos = await this.http.enviar({
      metodo: 'POST',
      ruta: '/usuarios/',
      cuerpo: {
        nombre_usuario: nueva.nombreUsuario,
        password: nueva.password,
        rol: nueva.rol,
        correo: nueva.correo,
        nombres: nueva.nombres,
        apellidos: nueva.apellidos,
      },
    })
    return aCuenta(UsuarioDto.parse(datos))
  }

  async actualizarUsuario(id: number, cambios: CambiosDeCuenta): Promise<CuentaDeUsuario> {
    const datos = await this.http.enviar({ metodo: 'PATCH', ruta: `/usuarios/${id}/`, cuerpo: cambios })
    return aCuenta(UsuarioDto.parse(datos))
  }

  async anonimizarUsuario(id: number): Promise<CuentaDeUsuario> {
    const datos = await this.http.enviar({ metodo: 'POST', ruta: `/usuarios/${id}/anonimizar/` })
    return aCuenta(UsuarioDto.parse(datos))
  }

  async listarGrupos(): Promise<GrupoAdministrable[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/grupos/?todos=true' })
    return z.array(GrupoDto).parse(datos).map(aGrupo)
  }

  async crearGrupo(datos: DatosDeGrupo): Promise<GrupoAdministrable> {
    const creado = await this.http.enviar({ metodo: 'POST', ruta: '/grupos/', cuerpo: cuerpoDeGrupo(datos) })
    return aGrupo(GrupoDto.parse(creado))
  }

  async actualizarGrupo(id: number, datos: Partial<DatosDeGrupo>): Promise<GrupoAdministrable> {
    const actualizado = await this.http.enviar({ metodo: 'PATCH', ruta: `/grupos/${id}/`, cuerpo: cuerpoDeGrupo(datos) })
    return aGrupo(GrupoDto.parse(actualizado))
  }

  async asignarAdministradores(grupoId: number, administradorIds: number[]): Promise<GrupoAdministrable> {
    const datos = await this.http.enviar({
      metodo: 'PUT',
      ruta: `/grupos/${grupoId}/administradores/`,
      cuerpo: { administrador_ids: administradorIds },
    })
    return aGrupo(GrupoDto.parse(datos))
  }
}
