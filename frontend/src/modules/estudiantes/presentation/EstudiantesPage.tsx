import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha } from '@/shared/lib/fecha'
import { Alert } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { DatosDeEstudianteInvalidos, type NuevoEstudiante } from '../domain/estudiante'
import { useEstudiantes, useRegistrarEstudiante } from './EstudiantesProvider'

type Errores = Partial<Record<keyof NuevoEstudiante, string>>

const VACIO: NuevoEstudiante = {
  nombres: '',
  apellidos: '',
  grado: '',
  documentoIdentidad: '',
  fechaNacimiento: null,
  autorizaTratamientoDatos: false,
}

/** Traduce los errores por campo de la API (`documento_identidad`, ...) a los nombres del formulario. */
const CAMPOS_API: Record<string, keyof NuevoEstudiante> = {
  nombres: 'nombres',
  apellidos: 'apellidos',
  grado: 'grado',
  documento_identidad: 'documentoIdentidad',
  fecha_nacimiento: 'fechaNacimiento',
  autoriza_tratamiento_datos: 'autorizaTratamientoDatos',
}

export default function EstudiantesPage() {
  const { push } = useToast()
  const { estudiantes, cargando } = useEstudiantes()
  const registrar = useRegistrarEstudiante()
  const [datos, setDatos] = useState<NuevoEstudiante>(VACIO)
  const [errores, setErrores] = useState<Errores>({})

  const cambiar = <K extends keyof NuevoEstudiante>(campo: K, valor: NuevoEstudiante[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    registrar.mutate(datos, {
      onSuccess: (creado) => {
        push(`${creado.nombre} quedó vinculado a tu cuenta`)
        setDatos(VACIO)
      },
      onError: (error) => {
        if (error instanceof DatosDeEstudianteInvalidos) return setErrores(error.campos)
        if (error instanceof ErrorApi) {
          const deCampos: Errores = {}
          for (const [campo, mensajes] of Object.entries(error.campos)) {
            const propio = CAMPOS_API[campo]
            if (propio && mensajes[0]) deCampos[propio] = mensajes[0]
          }
          if (Object.keys(deCampos).length > 0) return setErrores(deCampos)
          return push(error.detalle, 'warn')
        }
        return push('No se pudo registrar al estudiante. Intenta de nuevo.', 'warn')
      },
    })
  }

  const mensaje = (campo: keyof NuevoEstudiante) =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  return (
    <>
      <p className="kicker">FAMILIAS / MIS ESTUDIANTES</p>
      <h1 className="ptitle">Mis estudiantes</h1>
      <p className="sub">
        Registra a los estudiantes a tu cargo para poder solicitar su matrícula en los grupos extracurriculares.
      </p>

      <div className="two">
        <form className="card form" onSubmit={enviar} noValidate>
          <h3>Registrar estudiante</h3>
          <div className="row2">
            <label>
              Nombres *
              <input value={datos.nombres} onChange={(e) => cambiar('nombres', e.target.value)} maxLength={150} />
              {mensaje('nombres')}
            </label>
            <label>
              Apellidos *
              <input value={datos.apellidos} onChange={(e) => cambiar('apellidos', e.target.value)} maxLength={150} />
              {mensaje('apellidos')}
            </label>
          </div>
          <div className="row2">
            <label>
              Grado
              <input value={datos.grado} onChange={(e) => cambiar('grado', e.target.value)} maxLength={30} placeholder="Ej.: 5°" />
              {mensaje('grado')}
            </label>
            <label>
              Documento de identidad
              <input
                value={datos.documentoIdentidad}
                onChange={(e) => cambiar('documentoIdentidad', e.target.value)}
                maxLength={30}
                inputMode="numeric"
              />
              {mensaje('documentoIdentidad')}
            </label>
          </div>
          <label>
            Fecha de nacimiento
            <input
              type="date"
              value={datos.fechaNacimiento ?? ''}
              onChange={(e) => cambiar('fechaNacimiento', e.target.value || null)}
            />
            {mensaje('fechaNacimiento')}
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={datos.autorizaTratamientoDatos}
              onChange={(e) => cambiar('autorizaTratamientoDatos', e.target.checked)}
            />
            <span>
              Como acudiente, autorizo el tratamiento de los datos personales del estudiante, un menor de edad, para la gestión de
              grupos extracurriculares (Ley 1581 de 2012). *
            </span>
          </label>
          {mensaje('autorizaTratamientoDatos')}
          <button className="btn" disabled={registrar.isPending}>
            Registrar estudiante
          </button>
        </form>

        <aside className="card">
          <h3>¿Para qué sirve?</h3>
          <p>Cada solicitud de matrícula se hace por estudiante. Solo tú y la institución pueden ver estos datos.</p>
          <p>
            Cuando registres a tu estudiante, podrás{' '}
            <Link className="go" to="/familias/matricula">
              solicitar su matrícula →
            </Link>
          </p>
        </aside>
      </div>

      <section className="card">
        <h3>Estudiantes vinculados</h3>
        {cargando ? (
          <p className="muted-p">Cargando…</p>
        ) : estudiantes.length === 0 ? (
          <Alert tone="info" title="Aún no hay estudiantes">
            Usa el formulario para registrar al primero.
          </Alert>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Grado</th>
                  <th>Documento</th>
                  <th>Nacimiento</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b className="blue">{s.nombre}</b>
                    </td>
                    <td>{s.grado || '—'}</td>
                    <td>{s.documentoIdentidad || '—'}</td>
                    <td>{s.fechaNacimiento ? formatearFecha(s.fechaNacimiento) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
