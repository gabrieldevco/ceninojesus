import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { StatusBadge } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { useAuth } from '@/modules/auth'
import { iconoDeGrupo, useMisGrupos } from '@/modules/grupos'
import type { TipoMaterial } from '../domain/material'
import { useMateriales } from './AulaProvider'

const ICONO: Record<TipoMaterial, string> = { doc: '📄', video: '▶', link: '🔗' }

type Pestana = 'material' | 'info'

export default function AulaPage() {
  const { usuario } = useAuth()
  const { push } = useToast()
  const { grupos, cargando } = useMisGrupos()
  const [params, setParams] = useSearchParams()
  const [pestana, setPestana] = useState<Pestana>('material')

  // Solo llegan los grupos con matrícula aprobada: no hay forma de abrir uno bloqueado
  const pedido = Number(params.get('grupo'))
  const activo = grupos.find((g) => g.id === pedido) ?? grupos[0]
  const indiceActivo = activo ? grupos.indexOf(activo) : 0
  const materiales = useMateriales(activo?.nombre)

  return (
    <>
      <p className="kicker">MI ESPACIO / AULA ESTUDIANTE</p>
      <h1 className="ptitle">Aprende, explora y participa</h1>
      <p className="sub">
        {usuario?.nombre} · Contenido y fechas de ejemplo. Solo puedes acceder a los grupos con matrícula aprobada.
      </p>

      <section className="card">
        <h3>Mis grupos</h3>
        <div className="grid3 groups">
          {grupos.map((g) => (
            <motion.button
              key={g.id}
              className={`gtile ${activo?.id === g.id ? 'on' : ''}`}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setParams({ grupo: String(g.id) })}
            >
              <strong>{g.nombre}</strong>
              <StatusBadge status="aprobada" />
            </motion.button>
          ))}
        </div>
        <p className="muted-p">
          Aquí aparecen los grupos con matrícula aprobada. Las solicitudes pendientes se consultan en{' '}
          {usuario?.rol === 'acudiente' ? <Link to="/familias/matricula">Matrícula extracurricular</Link> : 'Matrícula extracurricular'}.
        </p>
      </section>

      {cargando ? (
        <p className="card">Cargando tus grupos…</p>
      ) : !activo ? (
        <p className="card">Aún no tienes grupos aprobados.</p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activo.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="banner">
              <span className="big-ico">{iconoDeGrupo(activo.nombre, indiceActivo)}</span>
              <div>
                <h2>{activo.nombre} · Aula del grupo</h2>
                <p>{activo.descripcion}</p>
              </div>
            </div>
            <div className="tabs">
              <button className={pestana === 'material' ? 'on' : ''} onClick={() => setPestana('material')}>
                Material y actividades
              </button>
              <button className={pestana === 'info' ? 'on' : ''} onClick={() => setPestana('info')}>
                Información del grupo
              </button>
            </div>
            {pestana === 'info' ? (
              <div className="card">
                <h3>Información del grupo</h3>
                <p>{activo.horario ? `Horario: ${activo.horario}.` : 'Horario por confirmar con la institución.'}</p>
                <p>Docente responsable y condiciones por confirmar con la institución.</p>
              </div>
            ) : (
              <div className="two lms">
                <div>
                  <h3 className="sech">Material del grupo</h3>
                  {materiales.map((m, i) => (
                    <motion.article
                      key={m.id}
                      className="card mat"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="mat-h">
                        <span className="mat-ico">{ICONO[m.tipo]}</span>
                        <div>
                          <b>{m.titulo}</b>
                          <small>{m.detalle}</small>
                        </div>
                      </div>
                      <span className="tag">{m.etiqueta} · Demostración</span>
                      <button className="btn outline" onClick={() => push('Archivos y enlaces pendientes de cargar', 'info')}>
                        {m.accion}
                      </button>
                    </motion.article>
                  ))}
                  <p className="muted-p">Archivos, videos y enlaces pendientes de cargar; no se incluyen URLs inventadas.</p>
                </div>
                <div>
                  <h3 className="sech">Actividad destacada</h3>
                  <div className="card">
                    <span className="badge coral">Actividad · Ejemplo</span>
                    <h3 className="act">Piensa tu próxima jugada</h3>
                    <p className="muted-p">Publicación: 03 oct 2026 · Fecha de ejemplo para la sesión: 08 oct 2026.</p>
                    <p>
                      Observa una posición del tablero y compara dos movimientos posibles. Explica cuál elegirías y qué pieza
                      necesitas proteger.
                    </p>
                    <b>Antes de la sesión</b>
                    <ol>
                      <li>Revisa la guía de piezas.</li>
                      <li>Identifica una amenaza.</li>
                      <li>Prepara una idea para compartir con el grupo.</li>
                    </ol>
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
