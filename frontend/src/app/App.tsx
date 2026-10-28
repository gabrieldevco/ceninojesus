import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { Toasts } from '@/shared/ui/toast'
import { PanelAdministracionPage } from '@/modules/administracion'
import { AccesoPage, puedeAcceder, RegistroPage, RestablecerClavePage, useAuth, type Rol } from '@/modules/auth'
import { AulaPage, GestionContenidoPage } from '@/modules/aula'
import { GestionSolicitudesDatosPage, SolicitudDeDatosPage } from '@/modules/datosPersonales'
import { EstudiantesPage } from '@/modules/estudiantes'
import { AdmisionesPage, GestionInteresadosPage } from '@/modules/interesados'
import { InicioPage, PoliticaDatosPage } from '@/modules/institucional'
import { MatriculaPage, SolicitudesPage } from '@/modules/matriculas'
import { PortalLayout, PublicLayout } from './Layouts'

/* Protege rutas por rol: sin sesión -> /acceso; rol incorrecto -> portal propio */
function Guard({ roles, crumb }: { roles: readonly Rol[]; crumb: string }) {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()
  if (cargando) return null
  if (!usuario) return <Navigate to="/acceso" replace state={{ from: ubicacion.pathname, roles }} />
  if (!puedeAcceder(usuario, roles)) return <Navigate to={usuario.inicio} replace />
  return <PortalLayout crumb={crumb} />
}

const Anim = ({ children }: { children: ReactNode }) => (
  <div className="page-in" key={useLocation().pathname}>
    {children}
  </div>
)

function BarraDeScroll() {
  const { scrollYProgress } = useScroll()
  const x = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  return <motion.div className="scrollbar" style={{ scaleX: x }} />
}

export default function App() {
  const ubicacion = useLocation()
  useEffect(() => {
    if (!ubicacion.hash) {
      window.scrollTo(0, 0)
      return undefined
    }
    const t = setTimeout(() => document.getElementById(ubicacion.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 350)
    return () => clearTimeout(t)
  }, [ubicacion.pathname, ubicacion.hash])

  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Anim><InicioPage /></Anim>} />
          <Route path="/acceso" element={<Anim><AccesoPage /></Anim>} />
          <Route path="/registro" element={<Anim><RegistroPage /></Anim>} />
          <Route path="/restablecer-contrasena" element={<Anim><RestablecerClavePage /></Anim>} />
          <Route path="/admisiones" element={<Anim><AdmisionesPage /></Anim>} />
          <Route path="/politica-de-datos" element={<Anim><PoliticaDatosPage /></Anim>} />
          <Route path="/solicitud-de-datos" element={<Anim><SolicitudDeDatosPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['acudiente']} crumb="Matrícula extracurricular" />}>
          <Route path="/familias/matricula" element={<Anim><MatriculaPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['acudiente']} crumb="Mis estudiantes" />}>
          <Route path="/familias/estudiantes" element={<Anim><EstudiantesPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['estudiante']} crumb="Aula estudiante" />}>
          <Route path="/estudiante/aula" element={<Anim><AulaPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['administrador_grupo', 'administrador']} crumb="Solicitudes" />}>
          <Route path="/admin/solicitudes" element={<Anim><SolicitudesPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['administrador_grupo', 'administrador']} crumb="Contenido del grupo" />}>
          <Route path="/admin/contenido" element={<Anim><GestionContenidoPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['administrador']} crumb="Interesados" />}>
          <Route path="/admin/interesados" element={<Anim><GestionInteresadosPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['administrador']} crumb="Usuarios y grupos" />}>
          <Route path="/admin/usuarios" element={<Anim><PanelAdministracionPage /></Anim>} />
        </Route>
        <Route element={<Guard roles={['administrador']} crumb="Datos personales" />}>
          <Route path="/admin/datos-personales" element={<Anim><GestionSolicitudesDatosPage /></Anim>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BarraDeScroll />
      <Toasts />
    </>
  )
}
