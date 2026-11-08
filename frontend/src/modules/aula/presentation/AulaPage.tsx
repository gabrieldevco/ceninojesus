import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha, formatearFechaHora } from '@/shared/lib/fecha'
import { useToast } from '@/shared/ui/toast'
import { useAuth } from '@/modules/auth'
import { useMisGrupos, type Grupo } from '@/modules/grupos'
import {
  EXTENSIONES_PERMITIDAS,
  TAMANO_MAXIMO_MB,
  accionDeContenido,
  esEnlaceSeguro,
  type Actividad,
  type Contenido,
  type TipoContenido,
  type TipoMaterial,
} from '../domain/contenido'
import {
  CLASE_ESTADO,
  ETIQUETA_ESTADO,
  EntregaInvalida,
  estadoDeTarea,
  type Entrega,
  type ErroresDeEntrega,
} from '../domain/entrega'
import { idDeYoutube } from '../domain/video'
import { useActividades, useDescargarArchivo, useEntregar, useMateriales, useMisEntregas } from './AulaProvider'
import { BannerDeClase, TarjetasDeClases } from './TarjetasDeClases'
import { VideoDelMaterial } from './VideoDelMaterial'

const ICONO: Record<TipoMaterial, string> = { documento: '📄', video: '▶', enlace: '🔗' }
const ETIQUETA: Record<TipoMaterial, string> = { documento: 'Documento', video: 'Video', enlace: 'Enlace' }

type Pestana = 'tablon' | 'tareas' | 'info'

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof ErrorApi) return error.detalle
  if (error instanceof Error && error.message) return error.message
  return porDefecto
}

/** Botón de acción de un material o actividad: descarga el archivo o abre el enlace. */
function AccionDeContenido({ contenido, tipo, etiqueta }: { contenido: Contenido; tipo: TipoContenido; etiqueta: string }) {
  const { push } = useToast()
  const descargar = useDescargarArchivo()
  const accion = accionDeContenido(contenido)

  if (accion === 'descargar') {
    return (
      <button
        type="button"
        className="btn outline sm"
        disabled={descargar.isPending}
        onClick={() =>
          descargar.mutate(
            { tipo, grupoId: contenido.grupoId, contenidoId: contenido.id, nombreSugerido: contenido.titulo },
            { onError: (error) => push(mensajeDeError(error, 'No se pudo descargar el archivo. Intenta de nuevo.'), 'warn') },
          )
        }
      >
        {descargar.isPending ? 'Descargando…' : `Descargar ${etiqueta}`}
      </button>
    )
  }
  if (accion === 'abrir-enlace' && esEnlaceSeguro(contenido.url)) {
    return (
      <a className="btn outline sm" href={contenido.url} target="_blank" rel="noopener noreferrer">
        {idDeYoutube(contenido.url) ? 'Abrir en YouTube ↗' : 'Abrir enlace ↗'}
      </a>
    )
  }
  return null
}

/** Formulario de entrega o, si ya está calificada, la nota y el comentario del docente. */
function ZonaDeEntrega({ actividad, entrega }: { actividad: Actividad; entrega: Entrega | undefined }) {
  const { push } = useToast()
  const entregar = useEntregar()
  const [editando, setEditando] = useState(!entrega)
  const [texto, setTexto] = useState(entrega?.texto ?? '')
  const [url, setUrl] = useState(entrega?.url ?? '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errores, setErrores] = useState<ErroresDeEntrega>({})

  if (entrega && entrega.calificacion !== null) {
    return (
      <div className="entrega-nota">
        <div className="entrega-nota-cifra">
          <b>{entrega.calificacion.toFixed(1)}</b>
          <small>de 5.0</small>
        </div>
        <div>
          <strong>Calificación del docente</strong>
          {entrega.comentarioDocente ? <p className="entrega-comentario">“{entrega.comentarioDocente}”</p> : <p className="muted-p">Sin comentarios.</p>}
          <small className="muted-p">Entregaste el {formatearFechaHora(entrega.fechaEntrega)}</small>
        </div>
      </div>
    )
  }

  if (entrega && !editando) {
    return (
      <div className="entrega-resumen">
        <p>
          ✔ Entregaste el {formatearFechaHora(entrega.fechaEntrega)}
          {entrega.tarde && <span className="badge coral">Tarde</span>}
        </p>
        {entrega.texto && <p className="entrega-texto">{entrega.texto}</p>}
        {entrega.url && esEnlaceSeguro(entrega.url) && (
          <a href={entrega.url} target="_blank" rel="noopener noreferrer">
            🔗 {entrega.url}
          </a>
        )}
        {entrega.archivoNombre && <p className="muted-p">📎 {entrega.archivoNombre}</p>}
        <button type="button" className="btn outline sm" onClick={() => setEditando(true)}>
          Modificar entrega
        </button>
        <small className="muted-p">Puedes cambiarla hasta que el docente la califique.</small>
      </div>
    )
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    entregar.mutate(
      { nueva: { grupoId: actividad.grupoId, actividadId: actividad.id, texto, url, archivo }, yaTieneArchivo: Boolean(entrega?.tieneArchivo) },
      {
        onSuccess: () => {
          push('¡Tarea entregada!')
          setArchivo(null)
          setEditando(false)
        },
        onError: (error) => {
          if (error instanceof EntregaInvalida) return setErrores(error.campos)
          return push(mensajeDeError(error, 'No se pudo entregar. Intenta de nuevo.'), 'warn')
        },
      },
    )
  }

  const err = (campo: keyof ErroresDeEntrega) =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  return (
    <form className="entrega-form" onSubmit={enviar} noValidate aria-label={`Entregar: ${actividad.titulo}`}>
      <label>
        Tu respuesta
        <textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe aquí tu respuesta o comentario…" />
        {err('texto')}
      </label>
      <div className="row2">
        <label>
          Enlace (opcional)
          <input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          {err('url')}
        </label>
        <label>
          Archivo (opcional)
          <input type="file" accept={EXTENSIONES_PERMITIDAS.join(',')} onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
          <small>
            Máximo {TAMANO_MAXIMO_MB} MB.{entrega?.archivoNombre ? ` Actual: ${entrega.archivoNombre}` : ''}
          </small>
          {err('archivo')}
        </label>
      </div>
      {err('recurso')}
      <div className="entrega-acciones">
        <button className="btn sm" disabled={entregar.isPending}>
          {entregar.isPending ? 'Entregando…' : entrega ? 'Volver a entregar' : 'Entregar tarea'}
        </button>
        {entrega && (
          <button type="button" className="btn outline sm" onClick={() => setEditando(false)}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

function Tarea({ actividad, entrega, abierta, onAlternar }: { actividad: Actividad; entrega: Entrega | undefined; abierta: boolean; onAlternar: () => void }) {
  const estado = estadoDeTarea(actividad, entrega)
  return (
    <article className={`tarea ${abierta ? 'abierta' : ''}`}>
      <button type="button" className="tarea-cab" onClick={onAlternar} aria-expanded={abierta}>
        <span className="tarea-ico" aria-hidden="true">
          📝
        </span>
        <span className="tarea-titulo">
          <b>{actividad.titulo}</b>
          <small>{actividad.fechaEntrega ? `Fecha de entrega: ${formatearFecha(actividad.fechaEntrega)}` : 'Sin fecha de entrega'}</small>
        </span>
        <span className={`badge ${CLASE_ESTADO[estado]}`}>
          {estado === 'calificada' && entrega?.calificacion !== null && entrega ? `${entrega.calificacion?.toFixed(1)} / 5.0` : ETIQUETA_ESTADO[estado]}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div className="tarea-cuerpo" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <p className="muted-p">Publicada: {formatearFecha(actividad.fechaPublicacion)}</p>
            {actividad.descripcion && <p className="tarea-desc">{actividad.descripcion}</p>}
            <AccionDeContenido contenido={actividad} tipo="actividades" etiqueta="adjunto" />
            <h4>Tu trabajo</h4>
            <ZonaDeEntrega actividad={actividad} entrega={entrega} />
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}

function ClaseDelEstudiante({ grupo, indice, onVolver }: { grupo: Grupo; indice: number; onVolver: () => void }) {
  const [pestana, setPestana] = useState<Pestana>('tablon')
  const [tareaAbierta, setTareaAbierta] = useState<number | null>(null)
  const materiales = useMateriales(grupo.id)
  const actividades = useActividades(grupo.id)
  const entregas = useMisEntregas(grupo.id)
  const entregaDe = (a: Actividad) => entregas.items.find((e) => e.actividadId === a.id)
  const pendientes = actividades.items.filter((a) => ['asignada', 'vencida'].includes(estadoDeTarea(a, entregaDe(a))))

  const abrirTarea = (id: number) => {
    setPestana('tareas')
    setTareaAbierta(id)
  }

  return (
    <>
      <BannerDeClase grupo={grupo} indice={indice} onVolver={onVolver} />
      <div className="clase-tabs" role="tablist" aria-label="Secciones de la clase">
        {(
          [
            ['tablon', 'Tablón'],
            ['tareas', `Tareas${pendientes.length ? ` (${pendientes.length})` : ''}`],
            ['info', 'Información'],
          ] as const
        ).map(([clave, texto]) => (
          <button key={clave} type="button" role="tab" aria-selected={pestana === clave} className={`clase-tab ${pestana === clave ? 'on' : ''}`} onClick={() => setPestana(clave)}>
            {texto}
          </button>
        ))}
      </div>

      {pestana === 'tablon' && (
        <div className="two lms">
          <div>
            <h3 className="sech">Material de la clase</h3>
            {materiales.cargando && <p className="muted-p">Cargando material…</p>}
            {materiales.error && <p className="muted-p">No pudimos cargar el material. Intenta de nuevo más tarde.</p>}
            {materiales.items.map((m, i) => (
              <motion.article key={m.id} className="clase-mat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <div className="clase-mat-h">
                  <div className="clase-mat-ico" aria-hidden="true">
                    {ICONO[m.tipo]}
                  </div>
                  <div>
                    <b>{m.titulo}</b>
                    <small>
                      {ETIQUETA[m.tipo]} · Publicado: {formatearFecha(m.fechaPublicacion)}
                    </small>
                  </div>
                </div>
                {m.descripcion && <p className="clase-mat-d">{m.descripcion}</p>}
                <VideoDelMaterial material={m} />
                <AccionDeContenido contenido={m} tipo="materiales" etiqueta={ETIQUETA[m.tipo].toLowerCase()} />
              </motion.article>
            ))}
            {!materiales.cargando && !materiales.error && materiales.items.length === 0 && (
              <p className="muted-p">El docente aún no ha publicado material.</p>
            )}
          </div>
          <aside className="card proximas">
            <h3>Próximas entregas</h3>
            {actividades.cargando && <p className="muted-p">Cargando…</p>}
            {!actividades.cargando && actividades.items.length === 0 && <p className="muted-p">No hay tareas por ahora. 🎉</p>}
            <ul>
              {actividades.items.map((a) => {
                const estado = estadoDeTarea(a, entregaDe(a))
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => abrirTarea(a.id)}>
                      <b>{a.titulo}</b>
                      <small>{a.fechaEntrega ? `Vence: ${formatearFecha(a.fechaEntrega)}` : 'Sin fecha'}</small>
                      <span className={`badge ${CLASE_ESTADO[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      )}

      {pestana === 'tareas' && (
        <div className="tareas">
          {actividades.cargando && <p className="muted-p">Cargando tareas…</p>}
          {actividades.error && <p className="muted-p">No pudimos cargar las tareas. Intenta de nuevo más tarde.</p>}
          {!actividades.cargando && !actividades.error && actividades.items.length === 0 && <p className="card">No hay tareas publicadas por ahora.</p>}
          {actividades.items.map((a) => (
            <Tarea
              key={a.id}
              actividad={a}
              entrega={entregaDe(a)}
              abierta={tareaAbierta === a.id}
              onAlternar={() => setTareaAbierta((actual) => (actual === a.id ? null : a.id))}
            />
          ))}
        </div>
      )}

      {pestana === 'info' && (
        <div className="card clase-info">
          <h3>Información de {grupo.nombre}</h3>
          <div className="clase-info-datos">
            <div>
              <strong>Horario de sesiones</strong>
              <span>{grupo.horario || 'Horario por confirmar con la institución.'}</span>
            </div>
            <div>
              <strong>Descripción</strong>
              <span>{grupo.descripcion || 'Sin descripción.'}</span>
            </div>
            <div>
              <strong>Calificaciones</strong>
              <span>De 0.0 a 5.0. Las notas y comentarios del docente aparecen en cada tarea.</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AulaPage() {
  const { usuario } = useAuth()
  const { grupos, cargando } = useMisGrupos()
  const [params, setParams] = useSearchParams()

  // Solo llegan los grupos con matrícula aprobada: no hay forma de abrir uno bloqueado
  const pedido = Number(params.get('grupo'))
  const indice = grupos.findIndex((g) => g.id === pedido)
  const activo = indice >= 0 ? grupos[indice] : undefined

  return (
    <>
      <p className="kicker"><Link to="/estudiante/espacio" className="kicker-link">MI ESPACIO</Link> / MIS CLASES</p>
      <h1 className="ptitle">Aprende, explora y participa</h1>
      <p className="sub">{usuario?.nombre} · Estas son las clases en las que tienes matrícula aprobada.</p>

      {cargando ? (
        <p className="card">Cargando tus clases…</p>
      ) : grupos.length === 0 ? (
        <p className="card">Aún no tienes clases aprobadas. Tu acudiente puede inscribirte en Matrícula extracurricular.</p>
      ) : activo ? (
        <ClaseDelEstudiante key={activo.id} grupo={activo} indice={indice} onVolver={() => setParams({})} />
      ) : (
        <TarjetasDeClases grupos={grupos} onAbrir={(g) => setParams({ grupo: String(g.id) })} pie={() => 'Entrar a la clase'} />
      )}
    </>
  )
}
