import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LINKS } from '@/shared/config/links'
import { Ico, Logo } from '@/shared/ui/ui'
import { useAuth, type Rol } from '@/modules/auth'

const TABS: ReadonlyArray<readonly [string, string]> = [['inicio', 'Inicio'], ['institucional', 'Institucional'], ['academico', 'Académico'], ['galeria', 'Vida escolar'], ['equipo', 'Equipo'], ['servicios', 'Servicios'], ['contacto', 'Contacto']]

export function PublicLayout() {
  return (
    <>
      <PublicNav />
      <Outlet />
      <Footer />
    </>
  )
}

function useScrollSpy(enabled: boolean) {
  const [active, setActive] = useState('inicio')
  useEffect(() => {
    if (!enabled) return
    const els = TABS.map(([id]) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-40% 0px -55% 0px' })
    els.forEach(el => io.observe(el)); return () => io.disconnect()
  }, [enabled])
  return active
}

export function PublicNav() {
  const { usuario } = useAuth(); const loc = useLocation()
  const [scrolled, setScrolled] = useState(false); const [menuAbiertoEn, setMenuAbiertoEn] = useState<string | null>(null)
  const home = loc.pathname === '/'
  const active = useScrollSpy(home)
  useEffect(() => { const f = () => setScrolled(window.scrollY > 24); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f) }, [])
  // El menú móvil se cierra solo al navegar: está abierto únicamente en la ruta donde se abrió
  const ruta = loc.pathname + loc.hash
  const open = menuAbiertoEn === ruta
  const setOpen = (valor: boolean | ((o: boolean) => boolean)) => setMenuAbiertoEn((actual) => ((typeof valor === 'function' ? valor(actual === ruta) : valor) ? ruta : null))
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  const to = (id: string) => id === 'inicio' ? '/' : `/#${id}`

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
          <Link to={usuario ? usuario.inicio : '/acceso'} className="btn-portal">{usuario ? 'Mi portal' : 'Portal de acceso'}</Link>
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
              <Link to={usuario ? usuario.inicio : '/acceso'} className="m-portal">{usuario ? 'Mi portal' : 'Portal de acceso'}</Link>
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
          <a className="fb-ico" href={LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook del Centro Educativo El Niño Jesús" title="Facebook">
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

const SOLICITUDES: [string, string, string][] = [['/admin/solicitudes', 'Solicitudes', '▤']]
const MENU: Record<Rol, [string, string, string][]> = {
  acudiente: [['/familias/estudiantes', 'Mis estudiantes', '☺'], ['/familias/matricula', 'Matrícula extracurricular', '▤']],
  estudiante: [['/estudiante/aula', 'Aula estudiante', '▥']],
  administrador_grupo: SOLICITUDES,
  administrador: SOLICITUDES,
}

export function PortalLayout({ crumb }: { crumb: string }) {
  const { usuario, cerrarSesion } = useAuth(); const nav = useNavigate()
  if (!usuario) return null
  return (
    <div className="portal">
      <aside className="side">
        <Link to="/"><Logo size={38} /></Link>
        <p className="side-kicker">PORTAL INSTITUCIONAL</p>
        <p className="side-role">{usuario.etiqueta}</p>
        <nav>
          {MENU[usuario.rol].map(([to, t, ico]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
              <i>{ico}</i>{t}
            </NavLink>
          ))}
          <a className="side-link" href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer"><i>🎓</i>Aula virtual ↗</a>
          <a className="side-link muted" href="#" onClick={e => e.preventDefault()} title="Pendiente de conexión"><i>▦</i>Biblioteca</a>
        </nav>
        <div className="side-note"><b>Acceso por permisos</b><p>Solo el alcance asignado a tu cuenta.</p></div>
        <Link className="side-help" to="/">Volver al sitio web</Link>
      </aside>
      <div className="portal-main">
        <header className="topbar">
          <span>Centro Educativo El Niño Jesús / {crumb}</span>
          <div className="top-right">
            <span className="bell" title="Notificaciones">🔔<em /></span>
            <span className="demo-pill">Demostración</span>
            <button className="linkbtn" onClick={() => void cerrarSesion().then(() => nav('/'))}>Cerrar sesión</button>
          </div>
        </header>
        <main className="portal-content"><Outlet /></main>
        <p className="portal-foot">Vista de diseño · Datos de demostración · Autenticación, notificaciones e integraciones requieren implementación.</p>
      </div>
    </div>
  )
}
