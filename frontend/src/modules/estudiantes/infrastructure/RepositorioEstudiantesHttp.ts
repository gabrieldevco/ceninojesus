import { z } from 'zod'
import type { HttpClient } from '@/shared/http/HttpClient'
import { nombreCompleto, type Estudiante, type NuevoAcceso, type NuevoEstudiante } from '../domain/estudiante'
import type { RepositorioEstudiantes } from '../domain/puertos'

const EstudianteDto = z.object({
  id: z.number(),
  nombres: z.string(),
  apellidos: z.string(),
  documento_identidad: z.string().default(''),
  fecha_nacimiento: z.string().nullable().default(null),
  grado: z.string().default(''),
  usuario_id: z.number().nullable().default(null),
})

function aEntidad(dto: z.infer<typeof EstudianteDto>): Estudiante {
  return {
    id: dto.id,
    nombres: dto.nombres,
    apellidos: dto.apellidos,
    nombre: nombreCompleto(dto.nombres, dto.apellidos),
    grado: dto.grado,
    documentoIdentidad: dto.documento_identidad,
    fechaNacimiento: dto.fecha_nacimiento,
    tieneAcceso: dto.usuario_id !== null,
  }
}

export class RepositorioEstudiantesHttp implements RepositorioEstudiantes {
  constructor(private readonly http: HttpClient) {}

  async listar(): Promise<Estudiante[]> {
    const datos = await this.http.enviar({ metodo: 'GET', ruta: '/estudiantes/' })
    return z.array(EstudianteDto).parse(datos).map(aEntidad)
  }

  async registrar(nuevo: NuevoEstudiante): Promise<Estudiante> {
    const datos = await this.http.enviar({
      metodo: 'POST',
      ruta: '/estudiantes/',
      cuerpo: {
        nombres: nuevo.nombres,
        apellidos: nuevo.apellidos,
        grado: nuevo.grado,
        documento_identidad: nuevo.documentoIdentidad,
        fecha_nacimiento: nuevo.fechaNacimiento,
        autoriza_tratamiento_datos: nuevo.autorizaTratamientoDatos,
      },
    })
    return aEntidad(EstudianteDto.parse(datos))
  }

  async crearAcceso(estudianteId: number, acceso: NuevoAcceso): Promise<Estudiante> {
    const datos = await this.http.enviar({
      metodo: 'POST',
      ruta: `/estudiantes/${estudianteId}/acceso/`,
      cuerpo: { nombre_usuario: acceso.nombreUsuario, password: acceso.clave },
    })
    return aEntidad(EstudianteDto.parse(datos))
  }

  async restablecerClave(estudianteId: number, clave: string): Promise<void> {
    await this.http.enviar({
      metodo: 'POST',
      ruta: `/estudiantes/${estudianteId}/acceso/contrasena/`,
      cuerpo: { password: clave },
    })
  }
}
