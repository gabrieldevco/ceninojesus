import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LINKS } from '@/shared/config/links'
import { useAuth } from '@/modules/auth'
import { useMisGrupos } from '@/modules/grupos'
import { useEnlaces } from '@/modules/institucional'

/** Inicio del estudiante: sus grupos aprobados, sus horarios y los accesos institucionales. */
export default function EspacioPage() {
  const { usuario } = useAuth()
  const { grupos, cargando } = useMisGrupos()
  const { enlaces } = useEnlaces()
  const biblioteca = enlaces.find((e) => e.tipo === 'biblioteca')
  const conHorario = grupos.filter((g) => g.horario).length

  return (
    <>
      <p className="kicker">PORTAL INSTITUCIONAL / MI ESPACIO</p>
      <h1 className="ptitle">Bienvenido a tu espacio</h1>
      <p className="sub">
        {usuario?.nombre || 'Estudiante'} · Centro Educativo El Niño Jesús. Consulta tus grupos extracurriculares, sus horarios y los
        accesos institucionales.
      </p>

      <div className="stats">
        <motion.div className="stat green" whileHover={{ y: -3 }}>
          <span>Grupos aprobados</span>
          <b>{cargando ? '…' : grupos.length}</b>
          <small>{grupos.length > 0 ? 'Con acceso al aula del grupo' : 'Sin grupos activos por ahora'}</small>
        </motion.div>
        <motion.div className="stat amber" whileHover={{ y: -3 }}>
          <span>Grupos con horario</span>
          <b>{cargando ? '…' : conHorario}</b>
          <small>{conHorario < grupos.length ? 'Algunos horarios están por confirmar' : 'Horarios publicados por la institución'}</small>
        </motion.div>
        <motion.div className="stat" whileHover={{ y: -3 }}>
          <span>Plataforma de notas</span>
          <b className="stat-texto">Control Academic</b>
          <small>Boletines y observador en el portal académico</small>
        </motion.div>
      </div>

      <section className="card esp-grupos">
        <div className="esp-cab">
          <div>
            <h3>Mis grupos extracurriculares</h3>
            <p className="muted-p">Material pedagógico, actividades semanales y acompañamiento docente.</p>
          </div>
          <Link to="/estudiante/aula" className="btn">
            Ir a mi aula de grupos →
          </Link>
        </div>

        {cargando ? (
          <p className="muted-p">Cargando tus grupos…</p>
        ) : grupos.length === 0 ? (
          <p className="muted-p">Aún no tienes grupos con matrícula aprobada. Tu acudiente puede inscribirte en Matrícula extracurricular.</p>
        ) : (
          <div className="grid-groups">
            {grupos.map((g) => (
              <Link key={g.id} to={`/estudiante/aula?grupo=${encodeURIComponent(String(g.id))}`} className="gtile-v2 esp-grupo">
                <span className="esp-grupo-h">
                  <strong>{g.nombre}</strong>
                  <span className="badge-pill approved">Aprobada</span>
                </span>
                <span className="esp-grupo-d">{g.descripcion || 'Acceso disponible a contenidos y actividades.'}</span>
                <span className="esp-grupo-ir">Abrir aula del grupo →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="two esp-dos">
        <div className="card">
          <h3>Portales de acceso académico</h3>
          <p className="muted-p">Servicios en la nube del Centro Educativo El Niño Jesús.</p>
          <a href={LINKS.aulaVirtual} target="_blank" rel="noopener noreferrer" className="ext">
            <span className="ext-ico">🎓</span>
            <span className="ext-txt">
              <b>Sistema académico (Control Academic)</b>
              <small>Boletines de calificaciones, tareas y observador estudiantil.</small>
            </span>
            <i aria-hidden="true">↗</i>
          </a>
          <a href={LINKS.correo} target="_blank" rel="noopener noreferrer" className="ext">
            <span className="ext-ico coral">✉</span>
            <span className="ext-txt">
              <b>Correo institucional</b>
              <small>Comunicación oficial con directivos y docentes.</small>
            </span>
            <i aria-hidden="true">↗</i>
          </a>
          {biblioteca && (
            <a href={biblioteca.url} target="_blank" rel="noopener noreferrer" className="ext">
              <span className="ext-ico green">📚</span>
              <span className="ext-txt">
                <b>{biblioteca.nombre}</b>
                <small>{biblioteca.descripcion || 'Lecturas recomendadas, proyectos y guías de investigación.'}</small>
              </span>
              <i aria-hidden="true">↗</i>
            </a>
          )}
        </div>

        <aside className="card">
          <h3>Horario de sesiones</h3>
          <p className="muted-p">Jornada extracurricular de tus grupos:</p>
          {grupos.length > 0 ? (
            <ul className="esp-horarios">
              {grupos.map((g) => (
                <li key={g.id}>
                  <strong>{g.nombre}</strong>
                  <span>{g.horario || 'Horario por confirmar con la institución'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-p">No hay horarios registrados.</p>
          )}
          <div className="esp-nota">
            <strong>Recordatorio institucional</strong>
            <p>La asistencia a los grupos extracurriculares fortalece tus competencias sociales, artísticas y deportivas.</p>
          </div>
        </aside>
      </div>
    </>
  )
}
