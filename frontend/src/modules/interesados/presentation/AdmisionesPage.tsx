import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ico } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { Link } from 'react-router-dom'

const GRADES = [
  { id: 'Preescolar', e: '🧸', c: 'gold' },
  { id: 'Primaria', e: '📚', c: 'green' },
  { id: 'Secundaria', e: '🔬', c: 'blue' },
  { id: 'Media', e: '🎓', c: 'coral' },
]
const STEPS = [
  { t: 'Envías tus datos', d: 'Completa el formulario en menos de un minuto.', c: 'gold' },
  { t: 'Te contactamos', d: 'Un asesor de admisiones se comunica contigo.', c: 'green' },
  { t: 'Seguimiento', d: 'Tu solicitud queda registrada con recordatorios.', c: 'coral' },
]
const mail = <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7.5l8.5 6 8.5-6" /></svg>
const user = <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.500 7.500 6.500" /></svg>
const phone = <svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>
const chat = <svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" /></svg>

export default function Admisiones() {
  const { push } = useToast()
  const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false)
  const [grade, setGrade] = useState('Preescolar'); const [name, setName] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault(); setBusy(true)
    setTimeout(() => { setBusy(false); setSent(true); push('Solicitud de información enviada'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, 700)
  }
  return (
    <>
      <section className="ad-hero">
        <i className="ac-blob a" /><i className="ac-blob b" />
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <span className="ac-pill">● ADMISIONES E INTERESADOS</span>
          <h1>Queremos <em>conocerte</em></h1>
          <p>Déjanos tus datos y el equipo de admisiones te contactará. Cada solicitud entra a un seguimiento con recordatorios para no perder ningún contacto.</p>
        </motion.div>
      </section>

      <div className="ad-wrap">
        <aside className="ad-info">
          <h3>¿Cómo funciona?</h3>
          <ol className="ad-steps">
            {STEPS.map((s, i) => (
              <motion.li key={s.t} className={s.c} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 + i * .12 }}>
                <span className="n">{i + 1}</span><div><b>{s.t}</b><small>{s.d}</small></div>
              </motion.li>
            ))}
          </ol>
          <div className="ad-contact">
            <small>PREFIERES HABLAR CON NOSOTROS</small>
            <a href="tel:+573344105"><span>{Ico.phone}</span>334 4105 · 315 8230785</a>
            <a href="mailto:ce_nino@hotmail.com"><span>{Ico.mail}</span>ce_nino@hotmail.com</a>
            <p><span>{Ico.pin}</span>Calle 38B # 4-35, Barranquilla</p>
          </div>
        </aside>

        <div>
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form key="f" className="ac-card ad-form" onSubmit={submit} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: .5 }}>
                <h2>Solicita información</h2>
                <p className="sub">Los campos con * son obligatorios.</p>
                <div className="ad-row">
                  <label>Nombre del acudiente *<span className="fld">{user}<input required value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" /></span></label>
                  <label>Teléfono *<span className="fld">{phone}<input required inputMode="tel" placeholder="300 000 0000" /></span></label>
                </div>
                <label>Correo electrónico *<span className="fld">{mail}<input type="email" required placeholder="correo@ejemplo.com" /></span></label>
                <div className="ad-lbl">Grado de interés</div>
                <div className="ad-grades">
                  {GRADES.map(g => (
                    <button type="button" key={g.id} className={`${g.c} ${grade === g.id ? 'on' : ''}`} onClick={() => setGrade(g.id)} aria-pressed={grade === g.id}>
                      <span>{g.e}</span>{g.id}
                    </button>
                  ))}
                </div>
                <label>Mensaje<span className="fld area">{chat}<textarea rows={3} placeholder="Cuéntanos qué necesitas saber" /></span></label>
                <button className="ac-go coral" disabled={busy}>{busy ? <span className="spin" /> : <>Enviar solicitud <span>→</span></>}</button>
                <p className="ad-priv">🔒 Usaremos tus datos únicamente para contactarte sobre admisiones.</p>
              </motion.form>
            ) : (
              <motion.div key="ok" className="ac-card ad-ok" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }}>
                <svg className="chk" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><motion.path d="M15 27l8 8 14-16" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: .25, duration: .5 }} /></svg>
                <h2>¡Gracias{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
                <p>Recibimos tu solicitud para <b>{grade}</b>. Un asesor se pondrá en contacto contigo y el seguimiento queda registrado para el equipo de admisiones.</p>
                <div className="ad-ok-btns"><Link to="/" className="btn">Volver al inicio</Link><button type="button" className="btn outline" onClick={() => setSent(false)}>Enviar otra solicitud</button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
