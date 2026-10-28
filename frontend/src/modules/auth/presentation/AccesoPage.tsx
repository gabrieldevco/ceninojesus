import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LINKS } from '@/shared/config/links'
import { Alert } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { DemasiadosIntentos } from '../domain/puertos'
import type { Rol } from '../domain/usuario'
import { useAuth } from './AuthProvider'

interface EstadoRuta {
  restricted?: boolean
  from?: string
  roles?: Rol[]
}

type Perfil = 'acudiente' | 'estudiante' | 'administrador_grupo'

/* Solo en modo demostración: cuentas de acceso rápido por perfil */
const CLAVE_DEMO = 'demo1234'

const ICONOS: Record<Perfil, ReactNode> = {
  acudiente: (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6M15.5 14.4c.5-.1 1-.2 1.5-.2 2.2 0 4 1.8 4 4" />
    </svg>
  ),
  estudiante: (
    <svg viewBox="0 0 24 24">
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5M22 9v6" />
    </svg>
  ),
  administrador_grupo: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l8 3v5.5c0 4.6-3.3 8.2-8 9.5-4.7-1.3-8-4.9-8-9.5V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </svg>
  ),
}

const PERFILES: { id: Perfil; t: string; corto: string; d: string; c: string; usuarioDemo: string }[] = [
  { id: 'acudiente', t: 'Padre o acudiente', corto: 'Acudiente', d: 'Solicitudes y resultados de matrícula extracurricular.', c: 'gold', usuarioDemo: 'padre' },
  { id: 'estudiante', t: 'Estudiante', corto: 'Estudiante', d: 'Grupos aprobados, materiales y actividades.', c: 'green', usuarioDemo: 'estudiante' },
  { id: 'administrador_grupo', t: 'Administrador', corto: 'Admin', d: 'Solo el grupo o el alcance autorizado.', c: 'coral', usuarioDemo: 'admin' },
]

const MENSAJE_SIN_CONEXION = 'No pudimos conectar con el servidor. Intenta de nuevo.'

export default function Acceso() {
  const { usuario, iniciarSesion, solicitarRecuperacion, modoDemo } = useAuth()
  const { push } = useToast()
  const nav = useNavigate()
  const loc = useLocation()
  const [usuarioIngresado, setUsuarioIngresado] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rec, setRec] = useState('')
  const [recSent, setRecSent] = useState(false)
  const [enviandoRec, setEnviandoRec] = useState(false)
  const [showRec, setShowRec] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | ''>('')
  const estado = (loc.state ?? {}) as EstadoRuta
  const restricted = estado.restricted

  if (usuario && !restricted) return <Navigate to={usuario.inicio} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      const u = await iniciarSesion(usuarioIngresado, pass)
      if (!u) return setErr('No pudimos iniciar sesión. Revisa tus datos o recupera el acceso.')
      push(`Bienvenido/a, ${u.nombre}`)
      return nav(estado.from && estado.roles?.includes(u.rol) ? estado.from : u.inicio, { replace: true })
    } catch (error) {
      return setErr(error instanceof DemasiadosIntentos ? error.message : MENSAJE_SIN_CONEXION)
    } finally {
      setBusy(false)
    }
  }

  const rellenar = (p: Perfil, usuarioDemo: string) => {
    setPerfil(p)
    setUsuarioIngresado(usuarioDemo)
    setPass(CLAVE_DEMO)
    setErr(null)
  }

  const recuperar = async () => {
    if (!rec.trim()) return
    setEnviandoRec(true)
    try {
      await solicitarRecuperacion(rec)
      setRecSent(true)
      push('Si existe una cuenta asociada, recibirás instrucciones.', 'info')
    } catch {
      push('No pudimos enviar la solicitud. Intenta de nuevo.', 'warn')
    } finally {
      setEnviandoRec(false)
    }
  }

  return (
    <div className="ac">
      <section className="ac-hero">
        <i className="ac-blob a" />
        <i className="ac-blob b" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="ac-pill">● TU COMUNIDAD, EN UN SOLO LUGAR</span>
          <h1>
            Bienvenido al <em>portal institucional</em>
          </h1>
          <p>
            Ingresa con la cuenta asignada por la institución. Los permisos de tu cuenta determinan qué áreas puedes consultar.
          </p>
        </motion.div>
        <div className="ac-roles">
          {PERFILES.map((r, i) => (
            <motion.div
              key={r.id}
              className={`ac-role ${r.c}`}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
            >
              <span className="ico">{ICONOS[r.id]}</span>
              <div>
                <b>{r.t}</b>
                <small>{r.d}</small>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div className="ac-foot" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}>
          <div className="ac-badge">
            <img src="/img/icfes.png" alt="Categoría A+ en Pruebas Saber" />
          </div>
          <div className="ac-stats">
            <div>
              <b>A+</b>
              <span>Pruebas Saber</span>
            </div>
            <div>
              <b>3</b>
              <span>Perfiles de acceso</span>
            </div>
            <div>
              <b>1</b>
              <span>Portal para todo</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="ac-side">
        <motion.form
          className="ac-card"
          onSubmit={(e) => void submit(e)}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2>Iniciar sesión</h2>
          <p className="sub">
            {modoDemo ? (
              <>
                Elige tu perfil para rellenar una cuenta de demostración (clave: <b>{CLAVE_DEMO}</b>).
              </>
            ) : (
              'Ingresa con el usuario y la contraseña asignados por la institución.'
            )}
          </p>
          {modoDemo && (
            <div className="ac-seg" role="tablist">
              {PERFILES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={perfil === r.id}
                  className={`${r.c} ${perfil === r.id ? 'on' : ''}`}
                  onClick={() => rellenar(r.id, r.usuarioDemo)}
                >
                  {ICONOS[r.id]}
                  <span>{r.corto}</span>
                </button>
              ))}
            </div>
          )}
          <label>
            Usuario
            <span className="fld">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="3.6" />
                <path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
              </svg>
              <input
                required
                autoComplete="username"
                value={usuarioIngresado}
                onChange={(e) => setUsuarioIngresado(e.target.value)}
                placeholder="Tu nombre de usuario"
              />
            </span>
          </label>
          <label>
            Contraseña
            <span className="fld">
              <svg viewBox="0 0 24 24">
                <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
                <path d="M8 10.5V8a4 4 0 018 0v2.5" />
              </svg>
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Ingresa tu contraseña"
              />
              <button type="button" className="eye" onClick={() => setShow((v) => !v)}>
                {show ? 'Ocultar' : 'Ver'}
              </button>
            </span>
          </label>
          <AnimatePresence>
            {err && (
              <motion.div key="e" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Alert tone="error" title="No se pudo iniciar sesión">
                  {err}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          {restricted && (
            <Alert tone="warn" title="Acceso restringido">
              Tu cuenta no tiene permisos para esa área. Contacta a la institución.
            </Alert>
          )}
          <button className="ac-go" disabled={busy}>
            {busy ? (
              <span className="spin" />
            ) : (
              <>
                Ingresar al portal <span>→</span>
              </>
            )}
          </button>
          <button type="button" className="ac-forgot" onClick={() => setShowRec((v) => !v)}>
            ¿Olvidaste tu acceso?
          </button>
          <AnimatePresence>
            {showRec && (
              <motion.div key="r" className="ac-rec" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="rec-in">
                  <span className="fld">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="3" />
                      <path d="M3.5 7.5l8.5 6 8.5-6" />
                    </svg>
                    <input value={rec} onChange={(e) => setRec(e.target.value)} placeholder="Usuario o correo de tu cuenta" />
                  </span>
                  <button type="button" disabled={enviandoRec} onClick={() => void recuperar()}>
                    Solicitar recuperación
                  </button>
                  {recSent && <small>Si la cuenta tiene un correo registrado, te enviamos el enlace.</small>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        <motion.div className="ac-ext" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
          <small>OTROS ACCESOS INSTITUCIONALES</small>
          <div>
            <a href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer" className="t1">
              <span className="ico">
                <svg viewBox="0 0 24 24">
                  <path d="M2 9l10-5 10 5-10 5z" />
                  <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
                </svg>
              </span>
              <b>Aula virtual</b>
              <em>Notas y tareas · Control Academic</em>
              <i>↗</i>
            </a>
            <a href={LINKS.correo} target="_blank" rel="noopener noreferrer" className="t2">
              <span className="ico">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M3.5 7.5l8.5 6 8.5-6" />
                </svg>
              </span>
              <b>Correo institucional</b>
              <em>Ingresa con tu cuenta Google</em>
              <i>↗</i>
            </a>
          </div>
        </motion.div>
        <motion.div className="ac-new" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}>
          <span className="ico">👋</span>
          <div>
            <b>¿Aún no eres parte de la familia?</b>
            <small>Déjanos tus datos y el equipo de admisiones te contacta.</small>
          </div>
          <Link to="/admisiones">Admisiones →</Link>
        </motion.div>
      </section>
    </div>
  )
}
