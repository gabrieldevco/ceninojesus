import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import { MensajeInvalido, type ErroresDeMensaje, type NuevoMensaje } from '../domain/contacto'
import { useEnviarMensaje } from './InstitucionalProvider'

const VACIO: NuevoMensaje = { nombre: '', correo: '', telefono: '', asunto: '', mensaje: '', autorizaTratamientoDatos: false }

/** Errores por campo de la API hacia los del formulario. */
const CAMPOS_API: Record<string, keyof NuevoMensaje> = {
  nombre: 'nombre',
  correo: 'correo',
  telefono: 'telefono',
  asunto: 'asunto',
  mensaje: 'mensaje',
  autoriza_tratamiento_datos: 'autorizaTratamientoDatos',
}

/** RF-03: formulario de contacto general para cualquier visitante. */
export default function FormularioContacto() {
  const { push } = useToast()
  const enviar = useEnviarMensaje()
  const [datos, setDatos] = useState<NuevoMensaje>(VACIO)
  const [errores, setErrores] = useState<ErroresDeMensaje>({})
  const [enviado, setEnviado] = useState(false)

  const cambiar = <K extends keyof NuevoMensaje>(campo: K, valor: NuevoMensaje[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const alEnviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    enviar.mutate(datos, {
      onSuccess: () => {
        setEnviado(true)
        setDatos(VACIO)
        push('Mensaje enviado. Te responderemos pronto.')
      },
      onError: (error) => {
        if (error instanceof MensajeInvalido) return setErrores(error.campos)
        if (error instanceof ErrorApi) {
          if (error.estado === 429) return push('Enviaste muchos mensajes seguidos. Intenta de nuevo en un rato.', 'warn')
          const deCampos: ErroresDeMensaje = {}
          for (const [campo, mensajes] of Object.entries(error.campos)) {
            const propio = CAMPOS_API[campo]
            if (propio && mensajes[0]) deCampos[propio] = mensajes[0]
          }
          return Object.keys(deCampos).length > 0 ? setErrores(deCampos) : push(error.detalle, 'warn')
        }
        return push('No pudimos enviar tu mensaje. Intenta de nuevo o llámanos.', 'warn')
      },
    })
  }

  const mensaje = (campo: keyof NuevoMensaje): ReactNode =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  if (enviado) {
    return (
      <div className="card contacto-ok" role="status">
        <h3>¡Gracias por escribirnos!</h3>
        <p>Recibimos tu mensaje y te responderemos al correo que dejaste.</p>
        <button className="btn outline" onClick={() => setEnviado(false)}>
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  return (
    <form className="card form" onSubmit={alEnviar} noValidate aria-label="Formulario de contacto">
      <h3>Escríbenos</h3>
      <div className="row2">
        <label>
          Nombre *
          <input value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} maxLength={150} autoComplete="name" />
          {mensaje('nombre')}
        </label>
        <label>
          Correo electrónico *
          <input type="email" value={datos.correo} onChange={(e) => cambiar('correo', e.target.value)} autoComplete="email" />
          {mensaje('correo')}
        </label>
      </div>
      <div className="row2">
        <label>
          Teléfono
          <input inputMode="tel" value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} maxLength={20} autoComplete="tel" />
          {mensaje('telefono')}
        </label>
        <label>
          Asunto *
          <input value={datos.asunto} onChange={(e) => cambiar('asunto', e.target.value)} maxLength={200} />
          {mensaje('asunto')}
        </label>
      </div>
      <label>
        Mensaje *
        <textarea rows={4} value={datos.mensaje} onChange={(e) => cambiar('mensaje', e.target.value)} />
        {mensaje('mensaje')}
      </label>
      <label className="check">
        <input type="checkbox" checked={datos.autorizaTratamientoDatos} onChange={(e) => cambiar('autorizaTratamientoDatos', e.target.checked)} />
        <span>
          Autorizo el tratamiento de mis datos personales para que el colegio me responda (Ley 1581 de 2012).{' '}
          <Link to="/politica-de-datos" target="_blank" rel="noopener noreferrer">
            Ver la política de datos
          </Link>
          . *
        </span>
      </label>
      {mensaje('autorizaTratamientoDatos')}
      <button className="btn" disabled={enviar.isPending}>
        {enviar.isPending ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
