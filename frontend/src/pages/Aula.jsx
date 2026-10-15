import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusBadge } from '../components/ui'
import { useRequests, useToast } from '../store'
import { GROUP_INFO, MATERIALS } from '../data/demo'

const ICON = { doc: '📄', video: '▶', link: '🔗' }

export default function Aula() {
  const { requests } = useRequests(); const { push } = useToast()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('material')
  const mine = requests.filter(r => r.student === 'Estudiante demo A')
  const approved = mine.filter(r => r.status === 'aprobada').map(r => r.group)
  const active = approved.includes(params.get('grupo')) ? params.get('grupo') : approved[0]
  const mats = MATERIALS[active] || []

  return (
    <>
      <p className="kicker">MI ESPACIO / AULA ESTUDIANTE</p>
      <h1 className="ptitle">Aprende, explora y participa</h1>
      <p className="sub">Estudiante demo A · Contenido y fechas de ejemplo. Solo puedes acceder a los grupos con matrícula aprobada.</p>

      <section className="card">
        <h3>Mis grupos</h3>
        <div className="grid3 groups">
          {mine.map(r => {
            const ok = r.status === 'aprobada'
            return (
              <motion.button key={r.id} className={`gtile ${ok ? '' : 'locked'} ${ok && active === r.group ? 'on' : ''}`} whileHover={ok ? { y: -4 } : {}} whileTap={ok ? { scale: .97 } : {}}
                onClick={() => ok ? setParams({ grupo: r.group }) : push(`${r.group} está bloqueado: espera la aprobación`, 'warn')}>
                <strong>{ok ? '' : '🔒 '}{r.group}</strong>
                <StatusBadge status={r.status} />
              </motion.button>
            )
          })}
        </div>
        {mine.some(r => r.status === 'pendiente') && <p className="muted-p">Los grupos pendientes están bloqueados hasta su aprobación. El estado se consulta en Matrícula extracurricular.</p>}
      </section>

      {!active ? <p className="card">Aún no tienes grupos aprobados.</p> : (
        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="banner">
              <span className="big-ico">{GROUP_INFO[active]?.icon}</span>
              <div><h2>{active} · Aula del grupo</h2><p>{GROUP_INFO[active]?.tagline}</p></div>
            </div>
            <div className="tabs">
              <button className={tab === 'material' ? 'on' : ''} onClick={() => setTab('material')}>Material y actividades</button>
              <button className={tab === 'info' ? 'on' : ''} onClick={() => setTab('info')}>Información del grupo</button>
            </div>
            {tab === 'info' ? <div className="card"><h3>Información del grupo</h3><p>Horarios, docente responsable y condiciones por confirmar con la institución.</p></div> : (
              <div className="two lms">
                <div>
                  <h3 className="sech">Material del grupo</h3>
                  {mats.map((m, i) => (
                    <motion.article key={m.id} className="card mat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .1 }} whileHover={{ x: 4 }}>
                      <div className="mat-h"><span className="mat-ico">{ICON[m.type]}</span><div><b>{m.title}</b><small>{m.meta}</small></div></div>
                      <span className="tag">{m.tag} · Demostración</span>
                      <button className="btn outline" onClick={() => push('Archivos y enlaces pendientes de cargar', 'info')}>{m.action}</button>
                    </motion.article>
                  ))}
                  <p className="muted-p">Archivos, videos y enlaces pendientes de cargar; no se incluyen URLs inventadas.</p>
                </div>
                <div>
                  <h3 className="sech">Actividad destacada</h3>
                  <div className="card"><span className="badge coral">Actividad · Ejemplo</span>
                    <h3 className="act">Piensa tu próxima jugada</h3>
                    <p className="muted-p">Publicación: 03 oct 2026 · Fecha de ejemplo para la sesión: 08 oct 2026.</p>
                    <p>Observa una posición del tablero y compara dos movimientos posibles. Explica cuál elegirías y qué pieza necesitas proteger.</p>
                    <b>Antes de la sesión</b><ol><li>Revisa la guía de piezas.</li><li>Identifica una amenaza.</li><li>Prepara una idea para compartir con el grupo.</li></ol>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )
}
