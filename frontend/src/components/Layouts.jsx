import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo, Ico } from './ui'
import { useAuth, useToast } from '../store'
import { LINKS } from '../data/links'

const TABS = [['inicio', 'Inicio'], ['institucional', 'Institucional'], ['academico', 'Académico'], ['galeria', 'Vida escolar'], ['equipo', 'Equipo'], ['servicios', 'Servicios'], ['contacto', 'Contacto']]
const FB = 'https://www.facebook.com/cenj.bq'

export function PublicLayout({ children }) {
  return (<><PublicNav />{children}<Footer /></>)
}

function useScrollSpy(enabled) {
  const [active, setActive] = useState('inicio')
  useEffect(() => {
    if (!enabled) return
    const els = TABS.map(([id]) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-40% 0px -55% 0px' })
    els.forEach(el => io.observe(el)); return () => io.disconnect()
  }, [enabled])
  return active
}

export function PublicNav() {
  const { user } = useAuth(); const loc = useLocation()
  const [scrolled, setScrolled] = useState(false); const [open, setOpen] = useState(false)
  const home = loc.pathname === '/'
  const active = useScrollSpy(home)
  useEffect(() => { const f = () => setScrolled(window.scrollY > 24); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f) }, [])
  useEffect(() => { setOpen(false) }, [loc.pathname, loc.hash])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  const to = id => id === 'inicio' ? '/' : `/#${id}`

  return (
    <>
      <header className={`pnav ${scrolled ? 'scrolled' : ''}`}>
        <Link to="/" aria-label="Inicio"><Logo size={scrolled ? 46 : 54} /></Link>
        <nav className="ptabs" aria-label="Principal">
          {TABS.map(([id, t]) => (
            <Link key={id} to={to(id)} className={`ptab ${home && active === id ? 'on' : ''}`}>
              {t}{home && active === id && <motion.i layoutId="tabline" className="tabline" />}
            </Link>
          ))}
        </nav>
        <div className="pacts">
          <a href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer" className="btn-aula"><span>🎓</span> Aula virtual</a>
          <Link to={user ? user.home : '/acceso'} className="btn-portal">{user ? 'Mi portal' : 'Portal de acceso'}</Link>
          <Link to="/admisiones" className="btn coral">Admisiones</Link>
        </div>
        <button className={`burger ${open ? 'x' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Abrir menú" aria-expanded={open}><i /><i /><i /></button>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div className="mmenu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.nav initial={{ y: -20 }} animate={{ y: 0 }} exit={{ y: -20 }}>
              {TABS.map(([id, t], i) => (
                <motion.div key={id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .04 }}>
                  <Link to={to(id)} className={home && active === id ? 'on' : ''}>{t}</Link>
                </motion.div>
              ))}
              <a href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer" className="m-aula">🎓 Aula virtual ↗</a>
              <Link to={user ? user.home : '/acceso'} className="m-portal">{user ? 'Mi portal' : 'Portal de acceso'}</Link>
              <Link to="/admisiones" className="btn coral full">Admisiones</Link>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div><Logo light /><p className="fdesc">Garantizando una formación intelectual y en valores cívicos con profunda conciencia del cuidado del medio ambiente y bilingüismo avanzado.</p>
          <a className="fb-ico" href={FB} target="_blank" rel="noopener noreferrer" aria-label="Facebook del Centro Educativo El Niño Jesús" title="Facebook">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/></svg>
          </a></div>
        <div><h4>ACCESOS RÁPIDOS</h4><Link to="/#institucional">Institucional</Link><Link to="/admisiones">Admisiones 2025</Link><Link to="/acceso">Portal de acceso</Link><a href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer">Aula virtual ↗</a><a href={LINKS.correo} target="_blank" rel="noopener noreferrer">Correo institucional ↗</a></div>
        <div><h4>CONTACTO E INFORMACIÓN</h4><p className="frow">{Ico.pin}<span>Calle 38B # 4-35, Barranquilla - Colombia</span></p><p className="frow">{Ico.phone}<span>334 4105 · 315 8230285</span></p><p className="frow">{Ico.mail}<span>ce_nino@hotmail.com</span></p></div>
        <img className="icfes" src="/img/icfes.png" alt="Categoría A+ en las Pruebas Saber (ICFES)" />
      </div>
      <div className="footer-bottom"><span>© 2025 Centro Educativo El Niño Jesús. Todos los derechos reservados.</span><span>Políticas de Privacidad · Términos de Servicio</span></div>
    </footer>
  )
}

const MENU = {
  padre: [['/familias/matricula', 'Matrícula extracurricular', '▤'], ['/estudiante/aula', 'Aula del estudiante', '▥']],
  estudiante: [['/estudiante/aula', 'Aula estudiante', '▥']],
  admin: [['/admin/solicitudes', 'Solicitudes', '▤']],
}

export function PortalLayout({ crumb }) {
  const { user, logout } = useAuth(); const { push } = useToast(); const nav = useNavigate()
  return (
    <div className="portal">
      <aside className="side">
        <Link to="/"><Logo size={38} /></Link>
        <p className="side-kicker">PORTAL INSTITUCIONAL</p>
        <p className="side-role">{user.label}</p>
        <nav>
          {user.role === 'estudiante' ? (
            <>
              <NavLink to="/estudiante/espacio" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
                <i>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </i>
                Mi espacio
              </NavLink>
              <NavLink to="/estudiante/aula" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
                <i>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
                </i>
                Aula estudiante
              </NavLink>
              <a className="side-link" href="#" onClick={e => { e.preventDefault(); push('Módulo de biblioteca Control Academic en integración.', 'info') }} title="Biblioteca virtual">
                <i>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
                </i>
                Biblioteca
              </a>
            </>
          ) : (
            <>
              {MENU[user.role]?.map(([to, t, ico]) => (
                <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
                  <i>{ico}</i>{t}
                </NavLink>
              ))}
              <a className="side-link" href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer"><i>🎓</i>Aula virtual ↗</a>
              <a className="side-link muted" href="#" onClick={e => e.preventDefault()} title="Pendiente de conexión"><i>▦</i>Biblioteca</a>
            </>
          )}
        </nav>
        <div className="side-note">
          <div className="side-note-h">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <b>Acceso por permisos</b>
          </div>
          <p>{user.role === 'estudiante' ? 'Los grupos requieren aprobación previa.' : 'Solo el alcance asignado a tu cuenta.'}</p>
        </div>
        <div className="side-links-foot">
          <a className="side-help" href="#" onClick={e => { e.preventDefault(); push('Canal de ayuda institucional: coordinacion@ceninojesus.edu.co · PBX: 334 4105', 'info') }}>Ayuda y contacto</a>
          <Link className="side-help" to="/">Volver al sitio web</Link>
        </div>
      </aside>
      <div className="portal-main">
        <header className="topbar">
          <span>Centro Educativo El Niño Jesús / {crumb}</span>
          <div className="top-right">
            <span className="bell" title="Notificaciones">🔔<em /></span>
            <span className="demo-pill">Demostración</span>
            <button className="linkbtn" onClick={() => { logout(); nav('/') }}>Cerrar sesión</button>
          </div>
        </header>
        <main className="portal-content"><Outlet /></main>
        <p className="portal-foot">Vista de diseño · Datos de demostración · Autenticación, notificaciones e integraciones requieren implementación.</p>
      </div>
    </div>
  )
}
