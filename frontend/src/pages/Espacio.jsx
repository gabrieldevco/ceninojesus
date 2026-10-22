import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useRequests, useAuth, useToast } from '../store'
import { LINKS } from '../data/links'

export default function Espacio() {
  const { user } = useAuth()
  const { requests } = useRequests()
  const { push } = useToast()

  const mine = requests.filter(r => r.student === 'Estudiante demo A')
  const approved = mine.filter(r => r.status === 'aprobada')
  const pending = mine.filter(r => r.status === 'pendiente')

  return (
    <>
      <p className="kicker">PORTAL INSTITUCIONAL / MI ESPACIO</p>
      <h1 className="ptitle">Bienvenido a tu espacio</h1>
      <p className="sub">
        {user?.name || 'Estudiante demo A'} · Centro Educativo El Niño Jesús. Consulta tu estado escolar, tus grupos extracurriculares y accesos institucionales.
      </p>

      {/* Franja de resumen */}
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '24px' }}>
        <motion.div className="stat green" whileHover={{ y: -3 }}>
          <span>Grupos aprobados</span>
          <b>{approved.length}</b>
          <small>Ajedrez y Danza con acceso habilitado</small>
        </motion.div>
        <motion.div className="stat amber" whileHover={{ y: -3 }}>
          <span>Solicitudes pendientes</span>
          <b>{pending.length}</b>
          <small>Robótica en revisión por el coordinador</small>
        </motion.div>
        <motion.div className="stat" whileHover={{ y: -3 }}>
          <span>Plataforma de notas</span>
          <b style={{ fontSize: '26px', marginTop: '14px' }}>Control Academic</b>
          <small>Sincronización activa con secretaría</small>
        </motion.div>
      </div>

      {/* Módulo de Grupos Extracurriculares */}
      <section className="card" style={{ padding: '26px 28px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '20px', color: '#003380', margin: '0 0 4px' }}>Mis grupos extracurriculares</h3>
            <p className="muted-p" style={{ margin: 0, fontSize: '13.5px' }}>
              Material pedagógico, actividades semanales y acompañamiento docente.
            </p>
          </div>
          <Link to="/estudiante/aula" className="btn" style={{ minHeight: '40px', fontSize: '13.5px' }}>
            Ir a mi Aula de grupos ➔
          </Link>
        </div>

        <div className="grid-groups">
          {mine.map(r => {
            const ok = r.status === 'aprobada'
            return (
              <div
                key={r.id}
                className={`gtile-v2 ${ok ? '' : 'locked'}`}
                style={{ padding: '18px 20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <strong>{r.group}</strong>
                  <span className={`badge-pill ${ok ? 'approved' : 'pending'}`}>
                    {ok ? 'Aprobada' : 'Pendiente'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 10px', fontSize: '13px', color: '#627187' }}>
                  {ok ? 'Acceso disponible a contenidos y actividades.' : 'En espera de aprobación por el administrador.'}
                </p>
                {ok ? (
                  <Link
                    to={`/estudiante/aula?grupo=${encodeURIComponent(r.group)}`}
                    style={{ fontSize: '13px', fontWeight: 700, color: '#004aad', textDecoration: 'none' }}
                  >
                    Abrir aula del grupo ↗
                  </Link>
                ) : (
                  <span style={{ fontSize: '12.5px', color: '#8a5a00' }}>
                    🔒 Consulta con tu acudiente
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Accesos Rápidos Institucionales */}
      <div className="two" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        <div className="card" style={{ padding: '24px 26px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '19px', color: '#003380', marginBottom: '8px' }}>Portales de acceso académico</h3>
          <p className="muted-p" style={{ fontSize: '13.5px', marginBottom: '18px' }}>
            Servicios en la nube integrados con el Centro Educativo El Niño Jesús.
          </p>

          <div style={{ display: 'grid', gap: '12px' }}>
            <a
              href={LINKS.aulaVirtual}
              target="_blank"
              rel="noopener noreferrer"
              className="ext"
              style={{ margin: 0, padding: '14px 16px' }}
            >
              <span className="ext-ico" style={{ background: '#eef5ff', color: '#004aad' }}>🎓</span>
              <div>
                <b>Sistema Académico (Control Academic)</b>
                <small>Consulta boletines de calificaciones, tareas y observador estudiantil.</small>
              </div>
              <i>↗</i>
            </a>

            <a
              href={LINKS.correo}
              target="_blank"
              rel="noopener noreferrer"
              className="ext"
              style={{ margin: 0, padding: '14px 16px' }}
            >
              <span className="ext-ico" style={{ background: '#fff0ee', color: '#f04a34' }}>✉</span>
              <div>
                <b>Correo Institucional</b>
                <small>Comunicación oficial con directivos y docentes vía Google Workspace.</small>
              </div>
              <i>↗</i>
            </a>

            <div
              className="ext"
              style={{ margin: 0, padding: '14px 16px', cursor: 'pointer' }}
              onClick={() => push('Biblioteca digital institucional en proceso de catalogación.', 'info')}
            >
              <span className="ext-ico" style={{ background: '#eef9f2', color: '#1e7a4d' }}>📚</span>
              <div>
                <b>Biblioteca Virtual Institucional</b>
                <small>Catálogo de lecturas recomendadas, proyectos y guías de investigación.</small>
              </div>
              <i>ℹ</i>
            </div>
          </div>
        </div>

        <aside className="card" style={{ padding: '24px 26px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '19px', color: '#003380', marginBottom: '8px' }}>Horario de sesiones</h3>
          <p className="muted-p" style={{ fontSize: '13px', marginBottom: '14px' }}>
            Jornada extracurricular de la semana en curso:
          </p>

          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fbff', border: '1px solid #dfe7f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#004aad', fontSize: '14px' }}>Ajedrez formativo</strong>
                <span className="badge-pill approved">Miércoles y Viernes</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#627187' }}>
                3:30 p.m. – 5:00 p.m. · Aula de informática
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fbff', border: '1px solid #dfe7f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: '#004aad', fontSize: '14px' }}>Danza y expresión artística</strong>
                <span className="badge-pill approved">Martes y Jueves</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#627187' }}>
                3:30 p.m. – 5:00 p.m. · Salón múltiple
              </p>
            </div>
          </div>

          <div style={{ marginTop: '18px', padding: '12px 14px', borderRadius: '12px', background: '#fff6df', border: '1px solid #ffe8b3' }}>
            <strong style={{ fontSize: '12.5px', color: '#8a5a00', display: 'block', marginBottom: '2px' }}>
              Recordatorio institucional
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: '#6c4700', lineHeight: 1.45 }}>
              La asistencia a grupos extracurriculares cuenta para el desarrollo de competencias de proyección social y artística.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
