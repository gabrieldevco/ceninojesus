import { useSearchParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRequests, useToast } from '../store'
import { GROUP_INFO, MATERIALS } from '../data/demo'

/* Iconos SVG delineados y modernos */
const ICONS = {
  puzzle: (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.439 7.85c0-1.57.85-2.05.85-3.05 0-1.1-.9-2-2-2-1 0-1.48.85-3.05.85s-2.05-.85-3.05-.85c-1.1 0-2 .9-2 2 0 1 .85 1.48.85 3.05s-.85 2.05-.85 3.05c0 1.1.9 2 2 2 1 0 1.48-.85 3.05-.85s2.05.85 3.05.85c1.1 0 2-.9 2-2 0-1-.85-1.48-.85-3.05Z"/>
      <path d="M4 12a2 2 0 0 1 2-2h1.5a2.5 2.5 0 0 0 2.5-2.5V6a2 2 0 0 1 2-2h2"/>
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#004aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#004aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="#004aad" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#004aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
}

/* Actividades destacadas por grupo */
const ACTIVITIES = {
  'Ajedrez': {
    title: 'Piensa tu próxima jugada',
    meta: 'Publicación: 03 oct 2026 · Fecha de ejemplo para la sesión: 08 oct 2026.',
    desc: 'Observa una posición del tablero y compara dos movimientos posibles. Explica cuál elegirías y qué pieza necesitas proteger.',
    beforeTitle: 'Antes de la sesión',
    steps: [
      'Revisa la guía de piezas.',
      'Identifica una amenaza.',
      'Prepara una idea para compartir con el grupo.',
    ],
    notice: 'Las indicaciones se trabajan con el docente. Esta vista no incluye un sistema de entrega de tareas.',
  },
  'Danza y arte': {
    title: 'Secuencia rítmica básica',
    meta: 'Publicación: 03 oct 2026 · Fecha de ejemplo para la sesión: 09 oct 2026.',
    desc: 'Practica la combinación de pasos aprendida en el calentamiento y coordina el ritmo corporal con la respiración y la música.',
    beforeTitle: 'Antes de la sesión',
    steps: [
      'Realiza los ejercicios de estiramiento.',
      'Repasa el video de calentamiento.',
      'Lleva calzado cómodo para el salón de danza.',
    ],
    notice: 'Las indicaciones se trabajan con el docente. Esta vista no incluye un sistema de entrega de tareas.',
  },
}

/* Información institucional de cada grupo */
const GROUP_DETAILS = {
  'Ajedrez': {
    docente: 'Prof. Raúl Medina — Coordinador de grupos extracurriculares',
    horario: 'Miércoles y viernes, 3:30 p.m. – 5:00 p.m.',
    espacio: 'Aula de Informática y Estrategia',
    objetivo: 'Fomentar el pensamiento lógico, la concentración y el respeto mutuo a través de tácticas y aperturas clásicas.',
  },
  'Danza y arte': {
    docente: 'Lic. Carmen Silva — Docente de Educación Artística',
    horario: 'Martes y jueves, 3:30 p.m. – 5:00 p.m.',
    espacio: 'Salón Múltiple Cultural',
    objetivo: 'Desarrollar la expresión corporal, la memoria coreográfica y la apreciación de los ritmos folclóricos de la región.',
  },
}

export default function Aula() {
  const { requests } = useRequests()
  const { push } = useToast()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('material')
  const [modalResource, setModalResource] = useState(null)

  // Solicitudes del estudiante demo A
  const mine = requests.filter(r => r.student === 'Estudiante demo A')

  // Ordenamos para que coincida exactamente con el prototipo: Ajedrez, Danza y arte, Robótica
  const sorted = [...mine].sort((a, b) => {
    if (a.group === 'Ajedrez') return -1
    if (b.group === 'Ajedrez') return 1
    if (a.group === 'Danza y arte') return -1
    if (b.group === 'Danza y arte') return 1
    return 0
  })

  const approved = mine.filter(r => r.status === 'aprobada').map(r => r.group)
  const active = approved.includes(params.get('grupo')) ? params.get('grupo') : (approved[0] || 'Ajedrez')
  const mats = MATERIALS[active] || []
  const currentActivity = ACTIVITIES[active] || ACTIVITIES['Ajedrez']
  const currentDetails = GROUP_DETAILS[active] || GROUP_DETAILS['Ajedrez']

  const handleOpenResource = (m) => {
    setModalResource(m)
    push(`Abriendo: ${m.title}`, 'info')
  }

  return (
    <>
      <p className="kicker">
        <Link to="/estudiante/espacio" style={{ color: 'inherit', textDecoration: 'none' }}>MI ESPACIO</Link> / AULA ESTUDIANTE
      </p>
      <h1 className="ptitle">Aprende, explora y participa</h1>
      <p className="sub">Estudiante demo A · Contenido y fechas de ejemplo. Solo puedes acceder a los grupos con matrícula aprobada.</p>

      {/* Tarjeta de selección de grupos */}
      <section className="groups-card">
        <h3>Mis grupos</h3>
        <div className="grid-groups">
          {sorted.map(r => {
            const ok = r.status === 'aprobada'
            const isSelected = ok && active === r.group

            return (
              <motion.button
                key={r.id}
                type="button"
                className={`gtile-v2 ${ok ? '' : 'locked'} ${isSelected ? 'on' : ''}`}
                whileHover={ok ? { y: -3 } : {}}
                whileTap={ok ? { scale: 0.98 } : {}}
                onClick={() => {
                  if (ok) {
                    setParams({ grupo: r.group })
                  } else {
                    push(`${r.group} está bloqueado: espera la aprobación. Tu acudiente puede consultar el estado en Matrícula extracurricular.`, 'warn')
                  }
                }}
              >
                <strong>{r.group}</strong>
                <span className={`badge-pill ${ok ? 'approved' : 'pending'}`}>
                  {ok ? 'Aprobada · Acceso disponible' : 'Pendiente · Sin acceso'}
                </span>
              </motion.button>
            )
          })}
        </div>
        <p className="muted-p" style={{ margin: '8px 0 0', fontSize: '13.5px' }}>
          Robótica está bloqueado: espera la aprobación. Tu acudiente puede consultar el estado en Matrícula extracurricular.
        </p>
      </section>

      {/* Banner del Aula del Grupo Activo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
        >
          <div className="aula-banner">
            <div className="aula-banner-ico">
              {ICONS.puzzle}
            </div>
            <div>
              <h2>{active} · Aula del grupo</h2>
              <p>{GROUP_INFO[active]?.tagline || 'Recursos de demostración para explorar estrategias y aprender las reglas del juego.'}</p>
            </div>
          </div>

          {/* Selector de pestañas */}
          <div className="aula-tabs">
            <button
              type="button"
              className={`tab-pill ${tab === 'material' ? 'on' : ''}`}
              onClick={() => setTab('material')}
            >
              Material y actividades
            </button>
            <button
              type="button"
              className={`tab-pill ${tab === 'info' ? 'on' : ''}`}
              onClick={() => setTab('info')}
            >
              Información del grupo
            </button>
          </div>

          {tab === 'info' ? (
            /* Vista de información del grupo */
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '20px', color: '#003380', marginBottom: '16px' }}>
                Información institucional del grupo {active}
              </h3>
              <div style={{ display: 'grid', gap: '16px', maxWidth: '640px', fontSize: '14px', lineHeight: 1.6 }}>
                <div>
                  <strong style={{ display: 'block', color: '#004aad' }}>Docente responsable:</strong>
                  <span>{currentDetails.docente}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: '#004aad' }}>Horario de sesiones:</strong>
                  <span>{currentDetails.horario}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: '#004aad' }}>Lugar de encuentro:</strong>
                  <span>{currentDetails.espacio}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', color: '#004aad' }}>Objetivo formativo:</strong>
                  <span>{currentDetails.objetivo}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Dos columnas: Material del grupo + Actividad destacada */
            <div className="two lms">
              {/* Columna Izquierda: Materiales */}
              <div>
                <h3 className="sech" style={{ fontSize: '20px', fontWeight: 800, color: '#003380', margin: '4px 0 16px' }}>
                  Material del grupo
                </h3>

                {mats.map((m, i) => (
                  <motion.article
                    key={m.id}
                    className="mat-card"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="mat-card-h">
                      <div className="mat-icon-wrap">
                        {ICONS[m.type] || ICONS.doc}
                      </div>
                      <div>
                        <b>{m.title}</b>
                        <small>{m.meta}</small>
                      </div>
                    </div>

                    <span className="badge-pill resource">
                      {m.tag} · Demostración
                    </span>

                    <button
                      type="button"
                      className="btn-mat-action"
                      onClick={() => handleOpenResource(m)}
                    >
                      {m.action}
                    </button>
                  </motion.article>
                ))}

                <p className="muted-p" style={{ fontSize: '13px', margin: '14px 0 0' }}>
                  Archivos, videos y enlaces pendientes de cargar; no se incluyen URLs inventadas.
                </p>
              </div>

              {/* Columna Derecha: Actividad destacada */}
              <div>
                <h3 className="sech" style={{ fontSize: '20px', fontWeight: 800, color: '#003380', margin: '4px 0 16px' }}>
                  Actividad destacada
                </h3>

                <div className="act-featured-card">
                  <span className="badge-pill activity">
                    Actividad · Ejemplo
                  </span>

                  <h3 className="act-featured-title">
                    {currentActivity.title}
                  </h3>

                  <p className="act-meta-line">
                    {currentActivity.meta}
                  </p>

                  <p className="act-desc-text">
                    {currentActivity.desc}
                  </p>

                  <span className="act-steps-title">
                    {currentActivity.beforeTitle}
                  </span>

                  <ol className="act-steps-list">
                    {currentActivity.steps.map((st, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{st}</li>
                    ))}
                  </ol>

                  {/* Caja informativa de participación */}
                  <div className="act-info-notice">
                    {ICONS.info}
                    <div>
                      <b>Participación en el grupo</b>
                      <p>{currentActivity.notice}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal interactivo de visualización de recurso */}
      <AnimatePresence>
        {modalResource && (
          <div className="modal-overlay" onClick={() => setModalResource(null)}>
            <motion.div
              className="modal-dialog"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => setModalResource(null)}
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div className="mat-icon-wrap" style={{ width: '48px', height: '48px' }}>
                  {ICONS[modalResource.type] || ICONS.doc}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#003380' }}>{modalResource.title}</h3>
                  <small style={{ color: '#627187' }}>{modalResource.meta}</small>
                </div>
              </div>

              <div style={{ background: '#f8fbff', border: '1px solid #dfe7f1', borderRadius: '12px', padding: '20px', margin: '16px 0' }}>
                {modalResource.type === 'doc' && (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 600, color: '#004aad' }}>
                      Vista previa del documento PDF (Modo demostración)
                    </p>
                    <p style={{ fontSize: '13.5px', color: '#627187', margin: 0 }}>
                      Este archivo contiene el material didáctico preparado por el docente titular para orientar el estudio personal y la práctica del grupo <strong>{active}</strong>.
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ minHeight: '38px', fontSize: '13px' }}
                        onClick={() => {
                          push('Descarga simulada: recurso disponible en el servidor institucional.', 'ok')
                          setModalResource(null)
                        }}
                      >
                        Simular descarga (PDF)
                      </button>
                    </div>
                  </div>
                )}

                {modalResource.type === 'video' && (
                  <div>
                    <div style={{ aspectRatio: '16/9', background: '#001a40', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#fff', marginBottom: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', margin: '0 auto 8px' }}>
                          ▶
                        </div>
                        <span style={{ fontSize: '13px', opacity: 0.85 }}>Reproductor de demostración · 08:20 min</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#627187', margin: 0 }}>
                      Video pedagógico estructurado con pautas de movimiento y ejercicios prácticos.
                    </p>
                  </div>
                )}

                {modalResource.type === 'link' && (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 600, color: '#004aad' }}>
                      Recurso externo verificado
                    </p>
                    <p style={{ fontSize: '13px', color: '#627187', margin: '0 0 14px' }}>
                      Enlace a tablero interactivo de práctica para explorar posiciones y partidas comentadas.
                    </p>
                    <button
                      type="button"
                      className="btn outline"
                      style={{ minHeight: '38px', fontSize: '13px' }}
                      onClick={() => {
                        push('Redirigiendo a entorno de práctica demostrativo...', 'info')
                        setModalResource(null)
                      }}
                    >
                      Abrir enlace en pestaña nueva ↗
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn ghost"
                  style={{ minHeight: '36px', fontSize: '13px' }}
                  onClick={() => setModalResource(null)}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
