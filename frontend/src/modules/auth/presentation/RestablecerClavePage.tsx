import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import { RestablecimientoInvalido, type ErroresDeRestablecimiento } from '../domain/registro'
import { useAuth } from './AuthProvider'

/** Pantalla a la que lleva el enlace del correo: /restablecer-contrasena?uid=…&token=… */
export default function RestablecerClavePage() {
  const { restablecerClave } = useAuth()
  const { push } = useToast()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''
  const [clave, setClave] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<ErroresDeRestablecimiento>({})
  const [enlaceInvalido, setEnlaceInvalido] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    setEnviando(true)
    try {
      await restablecerClave({ uid, token, clave, confirmacion })
      push('Cambiaste tu contraseña. Ya puedes iniciar sesión.')
      nav('/acceso', { replace: true })
    } catch (error) {
      if (error instanceof RestablecimientoInvalido) setErrores(error.campos)
      else if (error instanceof ErrorApi) {
        const mensajeDeClave = error.campos.password?.[0]
        if (mensajeDeClave) setErrores({ clave: mensajeDeClave })
        else setEnlaceInvalido(error.detalle)
      } else push('No pudimos cambiar la contraseña. Intenta de nuevo.', 'warn')
    } finally {
      setEnviando(false)
    }
  }

  const mensaje = (campo: keyof ErroresDeRestablecimiento): ReactNode =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  const sinDatos = !uid || !token
  return (
    <div className="ad-wrap" style={{ maxWidth: 560, margin: '40px auto' }}>
      <form className="ac-card ad-form" onSubmit={(e) => void enviar(e)} noValidate aria-label="Restablecer contraseña">
        <h2>Crea una contraseña nueva</h2>
        {sinDatos || enlaceInvalido ? (
          <>
            <p className="sub" role="alert">
              {enlaceInvalido ?? 'El enlace está incompleto. Pide uno nuevo desde “¿Olvidaste tu acceso?”.'}
            </p>
            <Link to="/acceso" className="btn">
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <p className="sub">Elige una contraseña de al menos 8 caracteres que no sea solo números.</p>
            <label>
              Contraseña nueva *
              <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" />
              {mensaje('clave')}
            </label>
            <label>
              Repite la contraseña *
              <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} autoComplete="new-password" />
              {mensaje('confirmacion')}
            </label>
            <button className="ac-go" disabled={enviando}>
              {enviando ? <span className="spin" /> : <>Cambiar contraseña <span>→</span></>}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
