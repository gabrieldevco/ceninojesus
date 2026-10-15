import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView, animate } from 'framer-motion'
import { useToast } from '../store'

export function Logo({ size = 44, light = false }) {
  return (
    <div className="logo">
      <img src="/escudo.png" width={size} height={size} alt="Escudo del Centro Educativo El Niño Jesús" className={light ? 'escudo on-dark' : 'escudo'} />
      <div className={`logo-text ${light ? 'light' : ''}`}>
        <strong>EL NIÑO JESÚS</strong><span>CENTRO EDUCATIVO</span>
      </div>
    </div>
  )
}

/* Aparece con desplazamiento suave al entrar en pantalla */
export function Reveal({ children, delay = 0, y = 24, className = '' }) {
  const ref = useRef(null); const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })
  const [force, setForce] = useState(false)
  useEffect(() => { const t = setTimeout(() => setForce(true), 1600); return () => clearTimeout(t) }, [])
  const show = inView || force
  return (
    <motion.div ref={ref} className={className} initial={false} animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.55, delay: show && !inView ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

/* Contador animado */
export function CountUp({ to }) {
  const ref = useRef(null); const inView = useInView(ref, { once: true })
  const [v, setV] = useState(0)
  useEffect(() => { if (!inView) return; const c = animate(0, to, { duration: 0.9, onUpdate: x => setV(Math.round(x)) }); return () => c.stop() }, [inView, to])
  return <span ref={ref}>{v}</span>
}

const LABEL = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' }
export const StatusBadge = ({ status }) => <span className={`badge ${status}`}>{LABEL[status]}</span>

export function Alert({ tone = 'info', title, children }) {
  return (
    <motion.div className={`alert ${tone}`} role={tone === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -8 }} animate={tone === 'error' ? { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}>
      <span className="alert-ico" aria-hidden="true">{tone === 'ok' ? '✓' : tone === 'info' ? 'i' : '!'}</span>
      <div><strong>{title}</strong><p>{children}</p></div>
    </motion.div>
  )
}

export function Toasts() {
  const { toasts } = useToast()
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} className={`toast ${t.tone}`} layout
            initial={{ opacity: 0, x: 60, scale: .95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export const Stat = ({ label, value, hint, tone }) => (
  <motion.div className={`stat ${tone || ''}`} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
    <span>{label}</span><b><CountUp to={value} /></b><small>{hint}</small>
  </motion.div>
)

const sv = (d, extra) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}{extra}</svg>
export const Ico = {
  pin: sv(<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />, <circle cx="12" cy="10" r="3" />),
  phone: sv(<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />),
  mail: sv(<rect x="2" y="4" width="20" height="16" rx="2" />, <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />),
}
