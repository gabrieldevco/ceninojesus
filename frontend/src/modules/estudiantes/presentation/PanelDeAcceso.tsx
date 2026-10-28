import { useState, type FormEvent } from 'react'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import { AccesoInvalido, type ErroresDeAcceso, type Estudiante } from '../domain/estudiante'
import { useCrearAcceso, useRestablecerClave } from './EstudiantesProvider'

export type ModoDeAcceso = 'crear' | 'clave'

/** Errores por campo de la API hacia los del formulario. */
const CAMPOS_API: Record<string, keyof ErroresDeAcceso> = { nombre_usuario: 'nombreUsuario', password: 'clave' }

function erroresDeApi(error: ErrorApi): ErroresDeAcceso {
  const campos: ErroresDeAcceso = {}
  for (const [campo, mensajes] of Object.entries(error.campos)) {
    const propio = CAMPOS_API[campo]
    if (propio && mensajes[0]) campos[propio] = mensajes[0]
  }
  return campos
}

/** Formulario en línea para crear el usuario del estudiante o cambiarle la contraseña. */
export default function PanelDeAcceso({
  estudiante,
  modo,
  alCerrar,
}: {
  estudiante: Estudiante
  modo: ModoDeAcceso
  alCerrar: () => void
}) {
  const { push } = useToast()
  const crear = useCrearAcceso()
  const restablecer = useRestablecerClave()
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<ErroresDeAcceso>({})
  const ocupado = crear.isPending || restablecer.isPending

  const alError = (error: unknown) => {
    if (error instanceof AccesoInvalido) return setErrores(error.campos)
    if (error instanceof ErrorApi) {
      const deCampos = erroresDeApi(error)
      return Object.keys(deCampos).length > 0 ? setErrores(deCampos) : push(error.detalle, 'warn')
    }
    return push('No se pudo guardar. Intenta de nuevo.', 'warn')
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    if (modo === 'crear') {
      crear.mutate(
        { estudianteId: estudiante.id, acceso: { nombreUsuario, clave, confirmacion } },
        {
          onSuccess: () => {
            push(`${estudiante.nombre} ya puede entrar al aula con su usuario`)
            alCerrar()
          },
          onError: alError,
        },
      )
    } else {
      restablecer.mutate(
        { estudianteId: estudiante.id, clave, confirmacion },
        {
          onSuccess: () => {
            push(`Cambiaste la contraseña de ${estudiante.nombre}`)
            alCerrar()
          },
          onError: alError,
        },
      )
    }
  }

  const mensaje = (campo: keyof ErroresDeAcceso) =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  return (
    <form className="card form" onSubmit={enviar} noValidate aria-label="Acceso del estudiante">
      <h3>{modo === 'crear' ? `Crear acceso para ${estudiante.nombre}` : `Cambiar la contraseña de ${estudiante.nombre}`}</h3>
      <p className="muted-p">
        {modo === 'crear'
          ? 'Con este usuario y contraseña el estudiante entra al aula para ver el material y las actividades de sus grupos. Guárdalos y entrégaselos tú.'
          : 'El estudiante usará la contraseña nueva la próxima vez que inicie sesión.'}
      </p>
      {modo === 'crear' && (
        <label>
          Nombre de usuario *
          <input
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            maxLength={150}
            autoComplete="off"
            autoCapitalize="none"
          />
          {mensaje('nombreUsuario')}
        </label>
      )}
      <div className="row2">
        <label>
          Contraseña *
          <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" />
          {mensaje('clave')}
        </label>
        <label>
          Repite la contraseña *
          <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} autoComplete="new-password" />
          {mensaje('confirmacion')}
        </label>
      </div>
      <div className="btns">
        <button className="btn" disabled={ocupado}>
          {modo === 'crear' ? 'Crear acceso' : 'Cambiar contraseña'}
        </button>
        <button type="button" className="btn outline" onClick={alCerrar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
