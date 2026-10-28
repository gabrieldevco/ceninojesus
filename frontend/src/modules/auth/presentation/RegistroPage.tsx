import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import { RegistroInvalido, type ErroresDeRegistro, type NuevoAcudiente } from '../domain/registro'
import { useAuth } from './AuthProvider'

const VACIO: NuevoAcudiente = {
  nombreUsuario: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  clave: '',
  confirmacion: '',
  autorizaTratamientoDatos: false,
}

/** Errores por campo de la API hacia los del formulario. */
const CAMPOS_API: Record<string, keyof NuevoAcudiente> = {
  nombre_usuario: 'nombreUsuario',
  nombres: 'nombres',
  apellidos: 'apellidos',
  correo: 'correo',
  telefono: 'telefono',
  password: 'clave',
  autoriza_tratamiento_datos: 'autorizaTratamientoDatos',
}

export default function RegistroPage() {
  const { registrarAcudiente } = useAuth()
  const { push } = useToast()
  const nav = useNavigate()
  const [datos, setDatos] = useState<NuevoAcudiente>(VACIO)
  const [errores, setErrores] = useState<ErroresDeRegistro>({})
  const [enviando, setEnviando] = useState(false)

  const cambiar = <K extends keyof NuevoAcudiente>(campo: K, valor: NuevoAcudiente[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    setEnviando(true)
    try {
      await registrarAcudiente(datos)
      push('Cuenta creada. Ya puedes iniciar sesión.')
      nav('/acceso', { replace: true })
    } catch (error) {
      if (error instanceof RegistroInvalido) setErrores(error.campos)
      else if (error instanceof ErrorApi) {
        if (error.estado === 429) push('Hiciste muchos intentos seguidos. Espera un rato e inténtalo de nuevo.', 'warn')
        else {
          const deCampos: ErroresDeRegistro = {}
          for (const [campo, mensajes] of Object.entries(error.campos)) {
            const propio = CAMPOS_API[campo]
            if (propio && mensajes[0]) deCampos[propio] = mensajes[0]
          }
          if (Object.keys(deCampos).length > 0) setErrores(deCampos)
          // Mensajes del dominio (p. ej. "El nombre de usuario ya está en uso") llegan como detalle
          else if (/usuario/i.test(error.detalle)) setErrores({ nombreUsuario: error.detalle })
          else push(error.detalle, 'warn')
        }
      } else push('No pudimos crear la cuenta. Intenta de nuevo.', 'warn')
    } finally {
      setEnviando(false)
    }
  }

  const mensaje = (campo: keyof NuevoAcudiente): ReactNode =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  return (
    <div className="ad-wrap" style={{ maxWidth: 720, margin: '40px auto' }}>
      <form className="ac-card ad-form" onSubmit={(e) => void enviar(e)} noValidate aria-label="Crear cuenta">
        <h2>Crear cuenta de acudiente</h2>
        <p className="sub">
          Con tu cuenta puedes registrar a tus estudiantes y solicitar su matrícula en los grupos extracurriculares. Los campos con * son
          obligatorios.
        </p>
        <div className="ad-row">
          <label>
            Nombres *
            <input value={datos.nombres} onChange={(e) => cambiar('nombres', e.target.value)} maxLength={150} autoComplete="given-name" />
            {mensaje('nombres')}
          </label>
          <label>
            Apellidos *
            <input value={datos.apellidos} onChange={(e) => cambiar('apellidos', e.target.value)} maxLength={150} autoComplete="family-name" />
            {mensaje('apellidos')}
          </label>
        </div>
        <div className="ad-row">
          <label>
            Correo electrónico *
            <input type="email" value={datos.correo} onChange={(e) => cambiar('correo', e.target.value)} autoComplete="email" />
            {mensaje('correo')}
          </label>
          <label>
            Teléfono
            <input inputMode="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} maxLength={20} autoComplete="tel" />
            {mensaje('telefono')}
          </label>
        </div>
        <label>
          Nombre de usuario *
          <input
            value={datos.nombreUsuario}
            onChange={(e) => cambiar('nombreUsuario', e.target.value)}
            maxLength={150}
            autoComplete="username"
            autoCapitalize="none"
          />
          {mensaje('nombreUsuario')}
        </label>
        <div className="ad-row">
          <label>
            Contraseña *
            <input type="password" value={datos.clave} onChange={(e) => cambiar('clave', e.target.value)} autoComplete="new-password" />
            {mensaje('clave')}
          </label>
          <label>
            Repite la contraseña *
            <input type="password" value={datos.confirmacion} onChange={(e) => cambiar('confirmacion', e.target.value)} autoComplete="new-password" />
            {mensaje('confirmacion')}
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={datos.autorizaTratamientoDatos}
            onChange={(e) => cambiar('autorizaTratamientoDatos', e.target.checked)}
          />
          <span>
            Autorizo el tratamiento de mis datos personales para la gestión de la matrícula y los grupos extracurriculares (Ley 1581 de
            2012). *
          </span>
        </label>
        {mensaje('autorizaTratamientoDatos')}
        <button className="ac-go" disabled={enviando}>
          {enviando ? <span className="spin" /> : <>Crear cuenta <span>→</span></>}
        </button>
        <p className="ad-priv">
          ¿Ya tienes cuenta? <Link to="/acceso">Inicia sesión</Link>
        </p>
      </form>
    </div>
  )
}
