import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import {
  ETIQUETA_DE_TIPO,
  SolicitudInvalida,
  TIPOS_DE_SOLICITUD,
  type ErroresDeSolicitud,
  type NuevaSolicitud,
  type TipoDeSolicitud,
} from '../domain/solicitud'
import { useRadicarSolicitud } from './DatosPersonalesProvider'

const VACIA: NuevaSolicitud = { nombre: '', correo: '', documentoIdentidad: '', tipo: 'consulta', descripcion: '' }

const CAMPOS_API: Record<string, keyof NuevaSolicitud> = {
  nombre: 'nombre',
  correo: 'correo',
  documento_identidad: 'documentoIdentidad',
  tipo: 'tipo',
  descripcion: 'descripcion',
}

/** Ley 1581: cualquier titular, con o sin cuenta, pide consultar, corregir o suprimir sus datos. */
export default function SolicitudDeDatosPage() {
  const { push } = useToast()
  const radicar = useRadicarSolicitud()
  const [datos, setDatos] = useState<NuevaSolicitud>(VACIA)
  const [errores, setErrores] = useState<ErroresDeSolicitud>({})
  const [radicada, setRadicada] = useState(false)

  const cambiar = <K extends keyof NuevaSolicitud>(campo: K, valor: NuevaSolicitud[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    radicar.mutate(datos, {
      onSuccess: () => setRadicada(true),
      onError: (error) => {
        if (error instanceof SolicitudInvalida) return setErrores(error.campos)
        if (error instanceof ErrorApi) {
          if (error.estado === 429) return push('Enviaste muchas solicitudes seguidas. Intenta de nuevo en un rato.', 'warn')
          const deCampos: ErroresDeSolicitud = {}
          for (const [campo, mensajes] of Object.entries(error.campos)) {
            const propio = CAMPOS_API[campo]
            if (propio && mensajes[0]) deCampos[propio] = mensajes[0]
          }
          return Object.keys(deCampos).length > 0 ? setErrores(deCampos) : push(error.detalle, 'warn')
        }
        return push('No pudimos radicar tu solicitud. Intenta de nuevo más tarde.', 'warn')
      },
    })
  }

  const mensaje = (campo: keyof NuevaSolicitud): ReactNode =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  if (radicada) {
    return (
      <div className="sec" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="card" role="status">
          <h2>Recibimos tu solicitud</h2>
          <p>
            Te responderemos al correo que dejaste dentro del plazo legal: 10 días hábiles para consultas y 15 para los demás reclamos.
          </p>
          <Link to="/" className="btn outline">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="sec" style={{ maxWidth: 720, margin: '0 auto' }}>
      <p className="eyebrow">LEY 1581 DE 2012</p>
      <h1>Ejerce tus derechos sobre tus datos</h1>
      <p>
        Puedes consultar, actualizar, rectificar o pedir la supresión de tus datos personales, o revocar tu autorización. No necesitas
        una cuenta. Antes de empezar puedes leer la <Link to="/politica-de-datos">política de tratamiento de datos</Link>.
      </p>
      <form className="card form" onSubmit={enviar} noValidate aria-label="Solicitud sobre datos personales">
        <label>
          ¿Qué necesitas? *
          <select value={datos.tipo} onChange={(e) => cambiar('tipo', e.target.value as TipoDeSolicitud)}>
            {TIPOS_DE_SOLICITUD.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETA_DE_TIPO[tipo]}
              </option>
            ))}
          </select>
        </label>
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
        <label>
          Documento de identidad
          <input value={datos.documentoIdentidad} onChange={(e) => cambiar('documentoIdentidad', e.target.value)} maxLength={30} />
          {mensaje('documentoIdentidad')}
        </label>
        <label>
          Cuéntanos tu solicitud *
          <textarea rows={5} value={datos.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
          {mensaje('descripcion')}
        </label>
        <button className="btn" disabled={radicar.isPending}>
          {radicar.isPending ? 'Enviando…' : 'Radicar solicitud'}
        </button>
      </form>
    </div>
  )
}
