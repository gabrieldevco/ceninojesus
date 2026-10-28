import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useAuth } from './store'
import { PortalLayout } from './components/Layouts'
import { Toasts } from './components/ui'
import Inicio from './pages/Inicio'
import Acceso from './pages/Acceso'
import Admisiones from './pages/Admisiones'
import Matricula from './pages/Matricula'
import Aula from './pages/Aula'
import Solicitudes from './pages/Solicitudes'

/* Protege rutas por rol: sin sesión → /acceso; rol incorrecto → /acceso con aviso */
function Guard({ roles, crumb }) {
  const { user } = useAuth(); const loc = useLocation()
  if (!user) return <Navigate to="/acceso" replace state={{ from: loc.pathname, role: roles[0] }} />
  if (!roles.includes(user.role)) return <Navigate to={user.home} replace />
  return <PortalLayout crumb={crumb} />
}

const Anim = ({ children }) => <div className="page-in" key={useLocation().pathname}>{children}</div>

function ScrollBar() {
  const { scrollYProgress } = useScroll(); const x = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  return <motion.div className="scrollbar" style={{ scaleX: x }} />
}

export default function App() {
  const loc = useLocation()
  useEffect(() => {
    if (!loc.hash) { window.scrollTo(0, 0); return undefined }
    const t = setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 350)
    return () => clearTimeout(t)
  }, [loc.pathname, loc.hash])
  return (
    <>
      <Routes>
          <Route path="/" element={<Anim><Inicio /></Anim>} />
          <Route path="/acceso" element={<Anim><Acceso /></Anim>} />
          <Route path="/admisiones" element={<Anim><Admisiones /></Anim>} />
          <Route element={<Guard roles={['padre']} crumb="Matrícula extracurricular" />}><Route path="/familias/matricula" element={<Anim><Matricula /></Anim>} /></Route>
          <Route element={<Guard roles={['estudiante', 'padre']} crumb="Aula estudiante" />}><Route path="/estudiante/aula" element={<Anim><Aula /></Anim>} /></Route>
          <Route element={<Guard roles={['admin']} crumb="Solicitudes" />}><Route path="/admin/solicitudes" element={<Anim><Solicitudes /></Anim>} /></Route>
          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ScrollBar />
      <Toasts />
    </>
  )
}
