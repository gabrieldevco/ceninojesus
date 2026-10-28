import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LINKS } from '@/shared/config/links'
import { Alert } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import type { Rol } from '../domain/usuario'
import { useAuth } from './AuthProvider'

interface EstadoRuta {
  restricted?: boolean
  from?: string
  role?: Rol
}

const CLAVE_DEMO = 'demo1234'

export default function Acceso() {
  const { usuario, iniciarSesion } = useAuth()
  const { push } = useToast()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState(false)
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rec, setRec] = useState('')
  const [recSent, setRecSent] = useState(false)
  const [showRec, setShowRec] = useState(false)
  const [role, setRole] = useState<Rol | ''>('')
  const estado = (loc.state ?? {}) as EstadoRuta
  const restricted = estado.restricted

  if (usuario && !restricted) return <Navigate to={usuario.inicio} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(false)
    setBusy(true)
    const u = await iniciarSesion(email, pass)
    setBusy(false)
    if (!u) return setErr(true)
    push(`Bienvenido/a, ${u.nombre}`)
    return nav(estado.from && estado.role === u.rol ? estado.from : u.inicio, { replace: true })
  }
  const fill = (r: Rol, e: string) => {
    setRole(r)
    setEmail(e)
    setPass(CLAVE_DEMO)
    setErr(false)
  }

  const I: Record<Rol, ReactNode> = {
    padre: <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6M15.5 14.4c.5-.1 1-.2 1.5-.2 2.2 0 4 1.8 4 4"/></svg>,
    estudiante: <svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5M22 9v6"/></svg>,
    admin: <svg viewBox="0 0 24 24"><path d="M12 3l8 3v5.5c0 4.600-3.300 8.200-8 9.500-4.700-1.300-8-4.900-8-9.500V6z"/><path d="M8.500 12l2.500 2.500 4.500-5"/></svg>,
  }
  const ROLES: { id: Rol; t: string; d: string; c: string; e: string }[] = [
    { id: 'padre', t: 'Padre o acudiente', d: 'Solicitudes y resultados de matrícula extracurricular.', c: 'gold', e: 'padre@demo.com' },
    { id: 'estudiante', t: 'Estudiante', d: 'Grupos aprobados, materiales y actividades.', c: 'green', e: 'estudiante@demo.com' },
    { id: 'admin', t: 'Administrador', d: 'Solo el grupo o el alcance autorizado.', c: 'coral', e: 'admin@demo.com' },
  ]
  return (
    <>
      <div className="ac">
        <section className="ac-hero">
          <i className="ac-blob a" /><i className="ac-blob b" />
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
            <span className="ac-pill">● TU COMUNIDAD, EN UN SOLO LUGAR</span>
            <h1>Bienvenido al <em>portal institucional</em></h1>
            <p>Ingresa con la cuenta asignada por la institución. Los permisos de tu cuenta determinan qué áreas puedes consultar.</p>
          </motion.div>
          <div className="ac-roles">
            {ROLES.map((r, i) => (
              <motion.div key={r.id} className={`ac-role ${r.c}`} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .25 + i * .12, duration: .5 }}>
                <span className="ico">{I[r.id]}</span><div><b>{r.t}</b><small>{r.d}</small></div>
              </motion.div>
            ))}
          </div>
          <motion.div className="ac-foot" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .7, duration: .6 }}>
            <div className="ac-badge"><img src="/img/icfes.png" alt="Categoría A+ en Pruebas Saber" /></div>
            <div className="ac-stats">
              <div><b>A+</b><span>Pruebas Saber</span></div>
              <div><b>3</b><span>Perfiles de acceso</span></div>
              <div><b>1</b><span>Portal para todo</span></div>
            </div>
          </motion.div>
        </section>

        <section className="ac-side">
          <motion.form className="ac-card" onSubmit={(e) => void submit(e)} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
            <h2>Iniciar sesión</h2>
            <p className="sub">Elige tu perfil para rellenar una cuenta de demostración (clave: <b>demo1234</b>).</p>
            <div className="ac-seg" role="tablist">
              {ROLES.map(r => (
                <button key={r.id} type="button" role="tab" aria-selected={role === r.id} className={`${r.c} ${role === r.id ? 'on' : ''}`} onClick={() => fill(r.id, r.e)}>
                  {I[r.id]}<span>{r.id === 'padre' ? 'Acudiente' : r.id === 'estudiante' ? 'Estudiante' : 'Admin'}</span>
                </button>
              ))}
            </div>
            <label>Correo electrónico
              <span className="fld"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.500 7.500l8.500 6 8.500-6"/></svg>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@correo.com" /></span></label>
            <label>Contraseña
              <span className="fld"><svg viewBox="0 0 24 24"><rect x="4.500" y="10.500" width="15" height="10" rx="3"/><path d="M8 10.500V8a4 4 0 018 0v2.500"/></svg>
                <input type={show ? 'text' : 'password'} required value={pass} onChange={e => setPass(e.target.value)} placeholder="Ingresa tu contraseña" />
                <button type="button" className="eye" onClick={() => setShow(v => !v)}>{show ? 'Ocultar' : 'Ver'}</button></span></label>
            <AnimatePresence>{err && <motion.div key="e" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}><Alert tone="error" title="Credenciales no válidas">No pudimos iniciar sesión. Revisa tus datos o recupera el acceso.</Alert></motion.div>}</AnimatePresence>
            {restricted && <Alert tone="warn" title="Acceso restringido">Tu cuenta no tiene permisos para esa área. Contacta a la institución.</Alert>}
            <button className="ac-go" disabled={busy}>{busy ? <span className="spin" /> : <>Ingresar al portal <span>→</span></>}</button>
            <button type="button" className="ac-forgot" onClick={() => setShowRec(v => !v)}>¿Olvidaste tu acceso?</button>
            <AnimatePresence>{showRec && (
              <motion.div key="r" className="ac-rec" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="rec-in">
                  <span className="fld"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.500 7.500l8.500 6 8.500-6"/></svg><input value={rec} onChange={e => setRec(e.target.value)} placeholder="Correo de tu cuenta" /></span>
                  <button type="button" onClick={() => rec && (setRecSent(true), push('Si existe una cuenta asociada, recibirás instrucciones.', 'info'))}>Solicitar recuperación</button>
                  {recSent && <small>Envío pendiente de implementación.</small>}
                </div>
              </motion.div>)}</AnimatePresence>
          </motion.form>

          <motion.div className="ac-ext" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .6 }}>
            <small>OTROS ACCESOS INSTITUCIONALES</small>
            <div>
              <a href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer" className="t1"><span className="ico"><svg viewBox="0 0 24 24"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.500V16c0 1.400 2.700 3 6 3s6-1.600 6-3v-4.500"/></svg></span><b>Aula virtual</b><em>Notas y tareas · Control Academic</em><i>↗</i></a>
              <a href={LINKS.correo} target="_blank" rel="noopener noreferrer" className="t2"><span className="ico"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.500 7.500l8.500 6 8.500-6"/></svg></span><b>Correo institucional</b><em>Ingresa con tu cuenta Google</em><i>↗</i></a>
            </div>
          </motion.div>
          <motion.div className="ac-new" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45, duration: .6 }}>
            <span className="ico">👋</span>
            <div><b>¿Aún no eres parte de la familia?</b><small>Déjanos tus datos y el equipo de admisiones te contacta.</small></div>
            <Link to="/admisiones">Admisiones →</Link>
          </motion.div>
        </section>
      </div>
    </>
  )
}
