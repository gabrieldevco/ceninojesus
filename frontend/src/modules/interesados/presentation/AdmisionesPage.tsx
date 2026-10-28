import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import { Ico } from '@/shared/ui/ui'
import { GRADOS, InteresadoInvalido, type ErroresDeInteresado, type GradoDeInteres, type NuevoInteresado } from '../domain/interesado'
import { useRegistrarInteresado } from './InteresadosProvider'

const COLOR_DE_GRADO: Record<GradoDeInteres, { emoji: string; color: string }> = {
  Preescolar: { emoji: '🧸', color: 'gold' },
  Primaria: { emoji: '📚', color: 'green' },
  Secundaria: { emoji: '🔬', color: 'blue' },
  Media: { emoji: '🎓', color: 'coral' },
}
const PASOS = [
  { t: 'Envías tus datos', d: 'Completa el formulario en menos de un minuto.', c: 'gold' },
  { t: 'Te contactamos', d: 'Un asesor de admisiones se comunica contigo.', c: 'green' },
  { t: 'Seguimiento', d: 'Tu solicitud queda registrada con recordatorios.', c: 'coral' },
]

const IconoCorreo = (
  <svg viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3.5 7.5l8.5 6 8.5-6" />
  </svg>
)
const IconoUsuario = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
  </svg>
)
const IconoTelefono = (
  <svg viewBox="0 0 24 24">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
  </svg>
)
const IconoMensaje = (
  <svg viewBox="0 0 24 24">
    <path d="M4 5h16v11H9l-5 4z" />
  </svg>
)

const VACIO: NuevoInteresado = {
  nombreCompleto: '',
  correo: '',
  telefono: '',
  nombreAspirante: '',
  gradoInteres: 'Preescolar',
  mensaje: '',
  autorizaTratamientoDatos: false,
}

/** Errores por campo de la API hacia los del formulario. */
const CAMPOS_API: Record<string, keyof NuevoInteresado> = {
  nombre_completo: 'nombreCompleto',
  correo: 'correo',
  telefono: 'telefono',
  nombre_aspirante: 'nombreAspirante',
  grado_interes: 'gradoInteres',
  mensaje: 'mensaje',
  autoriza_tratamiento_datos: 'autorizaTratamientoDatos',
}

export default function Admisiones() {
  const { push } = useToast()
  const registrar = useRegistrarInteresado()
  const [datos, setDatos] = useState<NuevoInteresado>(VACIO)
  const [errores, setErrores] = useState<ErroresDeInteresado>({})
  const [enviado, setEnviado] = useState<NuevoInteresado | null>(null)

  const cambiar = <K extends keyof NuevoInteresado>(campo: K, valor: NuevoInteresado[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    registrar.mutate(datos, {
      onSuccess: () => {
        setEnviado(datos)
        setDatos(VACIO)
        push('Solicitud de información enviada')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      },
      onError: (error) => {
        if (error instanceof InteresadoInvalido) return setErrores(error.campos)
        if (error instanceof ErrorApi) {
          if (error.estado === 429) return push('Enviaste muchas solicitudes seguidas. Intenta de nuevo en un rato.', 'warn')
          const deCampos: ErroresDeInteresado = {}
          for (const [campo, mensajes] of Object.entries(error.campos)) {
            const propio = CAMPOS_API[campo]
            if (propio && mensajes[0]) deCampos[propio] = mensajes[0]
          }
          return Object.keys(deCampos).length > 0 ? setErrores(deCampos) : push(error.detalle, 'warn')
        }
        return push('No pudimos enviar tu solicitud. Intenta de nuevo o llámanos.', 'warn')
      },
    })
  }

  const mensaje = (campo: keyof NuevoInteresado): ReactNode =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  return (
    <>
      <section className="ad-hero">
        <i className="ac-blob a" />
        <i className="ac-blob b" />
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="ac-pill">● ADMISIONES E INTERESADOS</span>
          <h1>
            Queremos <em>conocerte</em>
          </h1>
          <p>
            Déjanos tus datos y el equipo de admisiones te contactará. Cada solicitud entra a un seguimiento con recordatorios para
            no perder ningún contacto.
          </p>
        </motion.div>
      </section>

      <div className="ad-wrap">
        <aside className="ad-info">
          <h3>¿Cómo funciona?</h3>
          <ol className="ad-steps">
            {PASOS.map((s, i) => (
              <motion.li
                key={s.t}
                className={s.c}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.12 }}
              >
                <span className="n">{i + 1}</span>
                <div>
                  <b>{s.t}</b>
                  <small>{s.d}</small>
                </div>
              </motion.li>
            ))}
          </ol>
          <div className="ad-contact">
            <small>PREFIERES HABLAR CON NOSOTROS</small>
            <a href="tel:+573344105">
              <span>{Ico.phone}</span>334 4105 · 315 8230785
            </a>
            <a href="mailto:ce_nino@hotmail.com">
              <span>{Ico.mail}</span>ce_nino@hotmail.com
            </a>
            <p>
              <span>{Ico.pin}</span>Calle 38B # 4-35, Barranquilla
            </p>
          </div>
        </aside>

        <div>
          <AnimatePresence mode="wait">
            {!enviado ? (
              <motion.form
                key="f"
                className="ac-card ad-form"
                onSubmit={enviar}
                noValidate
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h2>Solicita información</h2>
                <p className="sub">Los campos con * son obligatorios.</p>
                <div className="ad-row">
                  <label>
                    Nombre del acudiente *
                    <span className="fld">
                      {IconoUsuario}
                      <input
                        value={datos.nombreCompleto}
                        onChange={(e) => cambiar('nombreCompleto', e.target.value)}
                        placeholder="Nombre completo"
                        maxLength={150}
                        autoComplete="name"
                      />
                    </span>
                    {mensaje('nombreCompleto')}
                  </label>
                  <label>
                    Teléfono *
                    <span className="fld">
                      {IconoTelefono}
                      <input
                        inputMode="tel"
                        value={datos.telefono}
                        onChange={(e) => cambiar('telefono', e.target.value)}
                        placeholder="300 000 0000"
                        maxLength={20}
                        autoComplete="tel"
                      />
                    </span>
                    {mensaje('telefono')}
                  </label>
                </div>
                <label>
                  Correo electrónico *
                  <span className="fld">
                    {IconoCorreo}
                    <input
                      type="email"
                      value={datos.correo}
                      onChange={(e) => cambiar('correo', e.target.value)}
                      placeholder="correo@ejemplo.com"
                      autoComplete="email"
                    />
                  </span>
                  {mensaje('correo')}
                </label>
                <label>
                  Nombre del aspirante
                  <span className="fld">
                    {IconoUsuario}
                    <input
                      value={datos.nombreAspirante}
                      onChange={(e) => cambiar('nombreAspirante', e.target.value)}
                      placeholder="Opcional"
                      maxLength={150}
                    />
                  </span>
                </label>
                <div className="ad-lbl">Grado de interés</div>
                <div className="ad-grades">
                  {GRADOS.map((g) => (
                    <button
                      type="button"
                      key={g}
                      className={`${COLOR_DE_GRADO[g].color} ${datos.gradoInteres === g ? 'on' : ''}`}
                      onClick={() => cambiar('gradoInteres', g)}
                      aria-pressed={datos.gradoInteres === g}
                    >
                      <span>{COLOR_DE_GRADO[g].emoji}</span>
                      {g}
                    </button>
                  ))}
                </div>
                <label>
                  Mensaje
                  <span className="fld area">
                    {IconoMensaje}
                    <textarea
                      rows={3}
                      value={datos.mensaje}
                      onChange={(e) => cambiar('mensaje', e.target.value)}
                      placeholder="Cuéntanos qué necesitas saber"
                    />
                  </span>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={datos.autorizaTratamientoDatos}
                    onChange={(e) => cambiar('autorizaTratamientoDatos', e.target.checked)}
                  />
                  <span>
                    Autorizo el tratamiento de mis datos personales para que el colegio me contacte sobre admisiones (Ley 1581 de
                    2012). *
                  </span>
                </label>
                {mensaje('autorizaTratamientoDatos')}
                <button className="ac-go coral" disabled={registrar.isPending}>
                  {registrar.isPending ? (
                    <span className="spin" />
                  ) : (
                    <>
                      Enviar solicitud <span>→</span>
                    </>
                  )}
                </button>
                <p className="ad-priv">🔒 Usaremos tus datos únicamente para contactarte sobre admisiones.</p>
              </motion.form>
            ) : (
              <motion.div
                key="ok"
                className="ac-card ad-ok"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 16 }}
              >
                <svg className="chk" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="24" />
                  <motion.path d="M15 27l8 8 14-16" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.5 }} />
                </svg>
                <h2>¡Gracias{enviado.nombreCompleto ? `, ${enviado.nombreCompleto.split(' ')[0]}` : ''}!</h2>
                <p>
                  Recibimos tu solicitud para <b>{enviado.gradoInteres}</b>. Un asesor se pondrá en contacto contigo y el seguimiento
                  queda registrado para el equipo de admisiones.
                </p>
                <div className="ad-ok-btns">
                  <Link to="/" className="btn">
                    Volver al inicio
                  </Link>
                  <button type="button" className="btn outline" onClick={() => setEnviado(null)}>
                    Enviar otra solicitud
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
