import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha } from '@/shared/lib/fecha'
import { StatusBadge } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { useAuth } from '@/modules/auth'
import { iconoDeGrupo, useMisGrupos } from '@/modules/grupos'
import { accionDeContenido, esEnlaceSeguro, type Contenido, type TipoContenido, type TipoMaterial } from '../domain/contenido'
import { useActividades, useDescargarArchivo, useMateriales } from './AulaProvider'

const ICONO: Record<TipoMaterial, string> = { documento: '📄', video: '▶', enlace: '🔗' }
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
        className="btn outline"
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
      <a className="btn outline" href={contenido.url} target="_blank" rel="noopener noreferrer">
        Abrir enlace ↗
      </a>
    )
  }
  return <span className="muted-p">Sin archivo ni enlace por ahora.</span>
}

export default function AulaPage() {
  const { usuario } = useAuth()
  const { grupos, cargando } = useMisGrupos()
  const [params, setParams] = useSearchParams()
  const [pestana, setPestana] = useState<Pestana>('material')

  // Solo llegan los grupos con matrícula aprobada: no hay forma de abrir uno bloqueado
  const pedido = Number(params.get('grupo'))
  const activo = grupos.find((g) => g.id === pedido) ?? grupos[0]
  const indiceActivo = activo ? grupos.indexOf(activo) : 0
  const materiales = useMateriales(activo?.id)
  const actividades = useActividades(activo?.id)

  return (
    <>
      <p className="kicker">MI ESPACIO / AULA ESTUDIANTE</p>
      <h1 className="ptitle">Aprende, explora y participa</h1>
      <p className="sub">{usuario?.nombre} · Solo puedes acceder a los grupos con matrícula aprobada.</p>

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
        <p className="muted-p">Aquí aparecen los grupos con matrícula aprobada.</p>
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
                  {materiales.cargando && <p className="muted-p">Cargando material…</p>}
                  {materiales.error && <p className="muted-p">No pudimos cargar el material. Intenta de nuevo más tarde.</p>}
                  {materiales.items.map((m, i) => (
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
                          <small>
                            {ETIQUETA[m.tipo]} · Publicado: {formatearFecha(m.fechaPublicacion)}
                          </small>
                        </div>
                      </div>
                      {m.descripcion && <p>{m.descripcion}</p>}
                      <AccionDeContenido contenido={m} tipo="materiales" etiqueta={ETIQUETA[m.tipo].toLowerCase()} />
                    </motion.article>
                  ))}
                  {!materiales.cargando && !materiales.error && materiales.items.length === 0 && (
                    <p className="muted-p">El administrador del grupo aún no ha publicado material.</p>
                  )}
                </div>
                <div>
                  <h3 className="sech">Actividades</h3>
                  {actividades.cargando && <p className="muted-p">Cargando actividades…</p>}
                  {actividades.error && <p className="muted-p">No pudimos cargar las actividades. Intenta de nuevo más tarde.</p>}
                  {actividades.items.map((a) => (
                    <div className="card" key={a.id}>
                      <span className="badge coral">Actividad</span>
                      <h3 className="act">{a.titulo}</h3>
                      <p className="muted-p">
                        Publicada: {formatearFecha(a.fechaPublicacion)}
                        {a.fechaEntrega && <> · Entrega: {formatearFecha(a.fechaEntrega)}</>}
                      </p>
                      {a.descripcion && <p>{a.descripcion}</p>}
                      <AccionDeContenido contenido={a} tipo="actividades" etiqueta="adjunto" />
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
