import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha } from '@/shared/lib/fecha'
import { useToast } from '@/shared/ui/toast'
import { useAuth } from '@/modules/auth'
import { useMisGrupos } from '@/modules/grupos'
import { accionDeContenido, esEnlaceSeguro, type Contenido, type TipoContenido, type TipoMaterial } from '../domain/contenido'
import { useActividades, useDescargarArchivo, useMateriales } from './AulaProvider'

const ICONOS_SVG: Record<TipoMaterial, JSX.Element> = {
  documento: (
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
  enlace: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#004aad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
}

const ETIQUETA: Record<TipoMaterial, string> = { documento: 'Documento', video: 'Video', enlace: 'Enlace' }

type Pestana = 'material' | 'info'

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) return error.detalle
  return 'No se pudo descargar el archivo. Intenta de nuevo.'
}

/** Botón de acción de un material o actividad: descarga el archivo o abre el enlace. */
function AccionDeContenido({ contenido, tipo, etiqueta }: { contenido: Contenido; tipo: TipoContenido; etiqueta: string }) {
  const { push } = useToast()
  const descargar = useDescargarArchivo()
  const accion = accionDeContenido(contenido)

  if (accion === 'descargar') {
    return (
      <button
        className="btn-mat-action"
        disabled={descargar.isPending}
        onClick={() =>
          descargar.mutate(
            { tipo, grupoId: contenido.grupoId, contenidoId: contenido.id, nombreSugerido: contenido.titulo },
            { onError: (error) => push(mensajeDeError(error), 'warn') },
          )
        }
      >
        {descargar.isPending ? 'Descargando…' : `Descargar ${etiqueta}`}
      </button>
    )
  }
  if (accion === 'abrir-enlace' && esEnlaceSeguro(contenido.url)) {
    return (
      <a className="btn-mat-action" href={contenido.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        Abrir enlace ↗
      </a>
    )
  }
  return <span className="muted-p" style={{ fontSize: '13px' }}>Sin archivo ni enlace por ahora.</span>
}

export default function AulaPage() {
  const { usuario } = useAuth()
  const { grupos, cargando } = useMisGrupos()
  const [params, setParams] = useSearchParams()
  const [pestana, setPestana] = useState<Pestana>('material')

  // Solo llegan los grupos con matrícula aprobada: no hay forma de abrir uno bloqueado
  const pedido = Number(params.get('grupo'))
  const activo = grupos.find((g) => g.id === pedido) ?? grupos[0]
  const materiales = useMateriales(activo?.id)
  const actividades = useActividades(activo?.id)

  return (
    <>
      <p className="kicker">
        <Link to="/estudiante/espacio" style={{ color: 'inherit', textDecoration: 'none' }}>MI ESPACIO</Link> / AULA ESTUDIANTE
      </p>
      <h1 className="ptitle">Aprende, explora y participa</h1>
      <p className="sub">{usuario?.nombre || 'Estudiante'} · Solo puedes acceder a los grupos con matrícula aprobada.</p>

      {/* Tarjeta de grupos del estudiante con estilo Figma */}
      <section className="groups-card">
        <h3>Mis grupos</h3>
        {grupos.length === 0 && !cargando ? (
          <p className="muted-p">Aún no tienes grupos con matrícula aprobada.</p>
        ) : (
          <div className="grid-groups">
            {grupos.map((g) => {
              const isSelected = activo?.id === g.id
              return (
                <motion.button
                  key={g.id}
                  type="button"
                  className={`gtile-v2 ${isSelected ? 'on' : ''}`}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setParams({ grupo: String(g.id) })}
                >
                  <strong>{g.nombre}</strong>
                  <span className="badge-pill approved">Aprobada · Acceso disponible</span>
                </motion.button>
              )
            })}
          </div>
        )}
        <p className="muted-p" style={{ margin: '8px 0 0', fontSize: '13.5px' }}>
          Aquí aparecen los grupos con matrícula aprobada.
        </p>
      </section>

      {cargando ? (
        <p className="card">Cargando tus grupos…</p>
      ) : !activo ? (
        <p className="card">Aún no tienes grupos aprobados.</p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activo.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="aula-banner">
              <div className="aula-banner-ico">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19.439 7.85c0-1.57.85-2.05.85-3.05 0-1.1-.9-2-2-2-1 0-1.48.85-3.05.85s-2.05-.85-3.05-.85c-1.1 0-2 .9-2 2 0 1 .85 1.48.85 3.05s-.85 2.05-.85 3.05c0 1.1.9 2 2 2 1 0 1.48-.85 3.05-.85s2.05.85 3.05.85c1.1 0 2-.9 2-2 0-1-.85-1.48-.85-3.05Z"/>
                  <path d="M4 12a2 2 0 0 1 2-2h1.5a2.5 2.5 0 0 0 2.5-2.5V6a2 2 0 0 1 2-2h2"/>
                </svg>
              </div>
              <div>
                <h2>{activo.nombre} · Aula del grupo</h2>
                <p>{activo.descripcion || 'Recursos y actividades para el acompañamiento y desarrollo formativo.'}</p>
              </div>
            </div>

            <div className="aula-tabs">
              <button
                type="button"
                className={`tab-pill ${pestana === 'material' ? 'on' : ''}`}
                onClick={() => setPestana('material')}
              >
                Material y actividades
              </button>
              <button
                type="button"
                className={`tab-pill ${pestana === 'info' ? 'on' : ''}`}
                onClick={() => setPestana('info')}
              >
                Información del grupo
              </button>
            </div>

            {pestana === 'info' ? (
              <div className="card" style={{ padding: '28px', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '20px', color: '#003380', marginBottom: '16px' }}>
                  Información institucional del grupo {activo.nombre}
                </h3>
                <div style={{ display: 'grid', gap: '16px', maxWidth: '640px', fontSize: '14px', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ display: 'block', color: '#004aad' }}>Horario de sesiones:</strong>
                    <span>{activo.horario || 'Horario por confirmar con la institución.'}</span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#004aad' }}>Docente responsable:</strong>
                    <span>Docente asignado por la institución</span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', color: '#004aad' }}>Objetivo formativo:</strong>
                    <span>{activo.descripcion || 'Fomentar el desarrollo integral de los estudiantes en actividades extracurriculares.'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="two lms">
                {/* Columna Izquierda: Materiales */}
                <div>
                  <h3 className="sech" style={{ fontSize: '20px', fontWeight: 800, color: '#003380', margin: '4px 0 16px' }}>
                    Material del grupo
                  </h3>
                  {materiales.cargando && <p className="muted-p">Cargando material…</p>}
                  {materiales.error && <p className="muted-p">No pudimos cargar el material. Intenta de nuevo más tarde.</p>}
                  {materiales.items.map((m, i) => (
                    <motion.article
                      key={m.id}
                      className="mat-card"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <div className="mat-card-h">
                        <div className="mat-icon-wrap">
                          {ICONOS_SVG[m.tipo] || ICONOS_SVG.documento}
                        </div>
                        <div>
                          <b>{m.titulo}</b>
                          <small>
                            {ETIQUETA[m.tipo]} · Publicado: {formatearFecha(m.fechaPublicacion)}
                          </small>
                        </div>
                      </div>
                      {m.descripcion && <p style={{ fontSize: '13.5px', color: '#627187', margin: 0 }}>{m.descripcion}</p>}
                      <span className="badge-pill resource">
                        {ETIQUETA[m.tipo]}
                      </span>
                      <AccionDeContenido contenido={m} tipo="materiales" etiqueta={ETIQUETA[m.tipo].toLowerCase()} />
                    </motion.article>
                  ))}
                  {!materiales.cargando && !materiales.error && materiales.items.length === 0 && (
                    <p className="muted-p">El administrador del grupo aún no ha publicado material.</p>
                  )}
                </div>

                {/* Columna Derecha: Actividades */}
                <div>
                  <h3 className="sech" style={{ fontSize: '20px', fontWeight: 800, color: '#003380', margin: '4px 0 16px' }}>
                    Actividades
                  </h3>
                  {actividades.cargando && <p className="muted-p">Cargando actividades…</p>}
                  {actividades.error && <p className="muted-p">No pudimos cargar las actividades. Intenta de nuevo más tarde.</p>}
                  {actividades.items.map((a) => (
                    <div className="act-featured-card" key={a.id} style={{ marginBottom: '16px' }}>
                      <span className="badge-pill activity">
                        Actividad
                      </span>
                      <h3 className="act-featured-title">
                        {a.titulo}
                      </h3>
                      <p className="act-meta-line">
                        Publicada: {formatearFecha(a.fechaPublicacion)}
                        {a.fechaEntrega && <> · Entrega: {formatearFecha(a.fechaEntrega)}</>}
                      </p>
                      {a.descripcion && (
                        <p className="act-desc-text">
                          {a.descripcion}
                        </p>
                      )}
                      <AccionDeContenido contenido={a} tipo="actividades" etiqueta="adjunto" />

                      <div className="act-info-notice" style={{ marginTop: '16px' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                        <div>
                          <b>Participación en el grupo</b>
                          <p>Las indicaciones se trabajan con el docente. Esta vista no incluye un sistema de entrega de tareas.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!actividades.cargando && !actividades.error && actividades.items.length === 0 && (
                    <p className="muted-p">No hay actividades publicadas por ahora.</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )
}
