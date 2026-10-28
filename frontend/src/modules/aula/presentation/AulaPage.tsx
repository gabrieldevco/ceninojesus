import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { StatusBadge } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { useAuth } from '@/modules/auth'
import { useGrupos } from '@/modules/grupos'
import { useSolicitudes } from '@/modules/matriculas'
import type { TipoMaterial } from '../domain/material'
import { useMateriales } from './AulaProvider'

const ICONO: Record<TipoMaterial, string> = { doc: '📄', video: '▶', link: '🔗' }

/** En la demostración un acudiente ve el aula del primer estudiante vinculado a su cuenta. */
const ESTUDIANTE_DEMO = 'Estudiante demo A'

type Pestana = 'material' | 'info'

export default function AulaPage() {
  const { usuario } = useAuth()
  const { push } = useToast()
  const { solicitudes } = useSolicitudes()
  const { grupos } = useGrupos()
  const [params, setParams] = useSearchParams()
  const [pestana, setPestana] = useState<Pestana>('material')

  const estudiante = usuario?.rol === 'estudiante' ? usuario.nombre : ESTUDIANTE_DEMO
  const mias = solicitudes.filter((s) => s.estudiante === estudiante)
  const aprobados = mias.filter((s) => s.estado === 'aprobada').map((s) => s.grupo)
  const pedido = params.get('grupo')
  const activo = pedido && aprobados.includes(pedido) ? pedido : aprobados[0]
  const materiales = useMateriales(activo)
  const infoActivo = grupos.find((g) => g.nombre === activo)

  return (
    <>
      <p className="kicker">MI ESPACIO / AULA ESTUDIANTE</p>
      <h1 className="ptitle">Aprende, explora y participa</h1>
      <p className="sub">
        {estudiante} · Contenido y fechas de ejemplo. Solo puedes acceder a los grupos con matrícula aprobada.
      </p>

      <section className="card">
        <h3>Mis grupos</h3>
        <div className="grid3 groups">
          {mias.map((s) => {
            const habilitado = s.estado === 'aprobada'
            return (
              <motion.button
                key={s.id}
                className={`gtile ${habilitado ? '' : 'locked'} ${habilitado && activo === s.grupo ? 'on' : ''}`}
                whileHover={habilitado ? { y: -4 } : {}}
                whileTap={habilitado ? { scale: 0.97 } : {}}
                onClick={() =>
                  habilitado ? setParams({ grupo: s.grupo }) : push(`${s.grupo} está bloqueado: espera la aprobación`, 'warn')
                }
              >
                <strong>
                  {habilitado ? '' : '🔒 '}
                  {s.grupo}
                </strong>
                <StatusBadge status={s.estado} />
              </motion.button>
            )
          })}
        </div>
        {mias.some((s) => s.estado === 'pendiente') && (
          <p className="muted-p">
            Los grupos pendientes están bloqueados hasta su aprobación. El estado se consulta en Matrícula extracurricular.
          </p>
        )}
      </section>

      {!activo ? (
        <p className="card">Aún no tienes grupos aprobados.</p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activo} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="banner">
              <span className="big-ico">{infoActivo?.icono}</span>
              <div>
                <h2>{activo} · Aula del grupo</h2>
                <p>{infoActivo?.lema}</p>
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
                <p>Horarios, docente responsable y condiciones por confirmar con la institución.</p>
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
