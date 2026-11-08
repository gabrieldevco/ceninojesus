import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha } from '@/shared/lib/fecha'
import { useToast } from '@/shared/ui/toast'
import { GrupoInvalido, useCrearGrupo, useMisGrupos, type Grupo } from '@/modules/grupos'
import {
  EXTENSIONES_PERMITIDAS,
  PublicacionInvalida,
  TAMANO_MAXIMO_MB,
  type Contenido,
  type ErroresDePublicacion,
  type TipoContenido,
  type TipoMaterial,
} from '../domain/contenido'
import {
  useActividades,
  useEliminarContenido,
  useMateriales,
  usePublicarActividad,
  usePublicarMaterial,
} from './AulaProvider'
import { RevisarEntregas } from './RevisarEntregas'
import { BannerDeClase, TarjetasDeClases } from './TarjetasDeClases'

interface Formulario {
  titulo: string
  descripcion: string
  tipo: TipoMaterial
  url: string
  archivo: File | null
  fechaEntrega: string
  publicado: boolean
}

const VACIO: Formulario = { titulo: '', descripcion: '', tipo: 'documento', url: '', archivo: null, fechaEntrega: '', publicado: true }
const ETIQUETA_TIPO: Record<TipoMaterial, string> = { documento: 'Documento', video: 'Video', enlace: 'Enlace' }

/** Errores por campo de la API (`url`, `titulo`, ...) hacia los del formulario. */
function erroresDeApi(error: ErrorApi): ErroresDePublicacion {
  const campos: ErroresDePublicacion = {}
  for (const clave of ['titulo', 'url', 'archivo'] as const) {
    const mensaje = error.campos[clave]?.[0]
    if (mensaje) campos[clave] = mensaje
  }
  return campos
}

function ListaGestionada({
  titulo,
  tipo,
  items,
  cargando,
  grupoId,
}: {
  titulo: string
  tipo: TipoContenido
  items: Contenido[]
  cargando: boolean
  grupoId: number
}) {
  const { push } = useToast()
  const eliminar = useEliminarContenido()
  const [confirmando, setConfirmando] = useState<number | null>(null)

  return (
    <section className="card">
      <h3>{titulo}</h3>
      {cargando && <p className="muted-p">Cargando…</p>}
      {!cargando && items.length === 0 && <p className="muted-p">Aún no hay publicaciones.</p>}
      {items.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Publicado el</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b className="blue">{c.titulo}</b>
                    {'tipo' in c && <small> · {ETIQUETA_TIPO[c.tipo]}</small>}
                    {'fechaEntrega' in c && c.fechaEntrega && <small> · Entrega {formatearFecha(c.fechaEntrega)}</small>}
                  </td>
                  <td>{formatearFecha(c.fechaPublicacion)}</td>
                  <td>
                    <span className={`badge ${c.publicado ? 'aprobada' : 'pendiente'}`}>{c.publicado ? 'Publicado' : 'Borrador'}</span>
                  </td>
                  <td>
                    {confirmando === c.id ? (
                      <>
                        <button
                          className="linkbtn"
                          disabled={eliminar.isPending}
                          onClick={() =>
                            eliminar.mutate(
                              { tipo, grupoId, contenidoId: c.id },
                              {
                                onSuccess: () => {
                                  setConfirmando(null)
                                  push('Publicación eliminada')
                                },
                                onError: (error) =>
                                  push(error instanceof ErrorApi ? error.detalle : 'No se pudo eliminar. Intenta de nuevo.', 'warn'),
                              },
                            )
                          }
                        >
                          Confirmar eliminación
                        </button>{' '}
                        <button className="linkbtn" onClick={() => setConfirmando(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button className="linkbtn" onClick={() => setConfirmando(c.id)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

type PestanaDocente = 'tablon' | 'entregas'

function ClaseDelDocente({ grupo, indice, onVolver }: { grupo: Grupo; indice: number; onVolver: () => void }) {
  const { push } = useToast()
  const [pestana, setPestana] = useState<PestanaDocente>('tablon')
  const [tipoDePublicacion, setTipoDePublicacion] = useState<TipoContenido>('materiales')
  const [datos, setDatos] = useState<Formulario>(VACIO)
  const [errores, setErrores] = useState<ErroresDePublicacion>({})
  // Cambiar la clave del input de archivo lo limpia después de publicar
  const [claveArchivo, setClaveArchivo] = useState(0)

  const materiales = useMateriales(grupo?.id)
  const actividades = useActividades(grupo?.id)
  const publicarMaterial = usePublicarMaterial()
  const publicarActividad = usePublicarActividad()
  const publicando = publicarMaterial.isPending || publicarActividad.isPending

  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores({})
  }

  const alExito = (mensaje: string) => {
    push(mensaje)
    setDatos(VACIO)
    setClaveArchivo((n) => n + 1)
  }
  const alError = (error: unknown) => {
    if (error instanceof PublicacionInvalida) return setErrores(error.campos)
    if (error instanceof ErrorApi) {
      const deCampos = erroresDeApi(error)
      return Object.keys(deCampos).length > 0 ? setErrores(deCampos) : push(error.detalle, 'warn')
    }
    return push('No se pudo publicar. Intenta de nuevo.', 'warn')
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setErrores({})
    const comun = { grupoId: grupo.id, titulo: datos.titulo, descripcion: datos.descripcion, url: datos.url, archivo: datos.archivo, publicado: datos.publicado }
    if (tipoDePublicacion === 'materiales') {
      publicarMaterial.mutate({ ...comun, tipo: datos.tipo }, { onSuccess: () => alExito('Material publicado'), onError: alError })
    } else {
      publicarActividad.mutate(
        { ...comun, fechaEntrega: datos.fechaEntrega || null },
        { onSuccess: () => alExito('Tarea publicada'), onError: alError },
      )
    }
  }

  const mensaje = (campo: keyof ErroresDePublicacion) =>
    errores[campo] ? (
      <small className="field-err" role="alert">
        {errores[campo]}
      </small>
    ) : null

  const esMaterial = tipoDePublicacion === 'materiales'

  return (
    <>
      <BannerDeClase grupo={grupo} indice={indice} onVolver={onVolver} />
      <div className="clase-tabs" role="tablist" aria-label="Secciones de la clase">
        <button type="button" role="tab" aria-selected={pestana === 'tablon'} className={`clase-tab ${pestana === 'tablon' ? 'on' : ''}`} onClick={() => setPestana('tablon')}>
          Tablón y publicaciones
        </button>
        <button type="button" role="tab" aria-selected={pestana === 'entregas'} className={`clase-tab ${pestana === 'entregas' ? 'on' : ''}`} onClick={() => setPestana('entregas')}>
          Entregas y calificaciones
        </button>
      </div>

      {pestana === 'entregas' ? (
        <RevisarEntregas grupoId={grupo.id} actividades={actividades.items} />
      ) : (
        <>
      <div className="tabs">
        <button className={esMaterial ? 'on' : ''} onClick={() => { setTipoDePublicacion('materiales'); setErrores({}) }}>
          Material de apoyo
        </button>
        <button className={!esMaterial ? 'on' : ''} onClick={() => { setTipoDePublicacion('actividades'); setErrores({}) }}>
          Tarea
        </button>
      </div>

      <form className="card form" onSubmit={enviar} noValidate>
        <h3>{esMaterial ? 'Publicar material' : 'Publicar tarea'}</h3>
        <label>
          Título *
          <input value={datos.titulo} onChange={(e) => cambiar('titulo', e.target.value)} maxLength={200} />
          {mensaje('titulo')}
        </label>
        <label>
          Descripción
          <textarea rows={3} value={datos.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
        </label>
        <div className="row2">
          {esMaterial ? (
            <label>
              Tipo
              <select value={datos.tipo} onChange={(e) => cambiar('tipo', e.target.value as TipoMaterial)}>
                {(Object.keys(ETIQUETA_TIPO) as TipoMaterial[]).map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETA_TIPO[t]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Fecha de entrega
              <input type="date" value={datos.fechaEntrega} onChange={(e) => cambiar('fechaEntrega', e.target.value)} />
            </label>
          )}
          <label>
            Enlace
            <input
              type="url"
              value={datos.url}
              onChange={(e) => cambiar('url', e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
            {mensaje('url')}
          </label>
        </div>
        <label>
          Archivo
          <input
            key={claveArchivo}
            type="file"
            accept={EXTENSIONES_PERMITIDAS.join(',')}
            onChange={(e) => cambiar('archivo', e.target.files?.[0] ?? null)}
          />
          <small>Máximo {TAMANO_MAXIMO_MB} MB. {esMaterial ? 'El material necesita un archivo o un enlace. Los videos de YouTube se ven dentro de la clase.' : 'Opcional.'}</small>
          {mensaje('archivo')}
          {mensaje('recurso')}
        </label>
        <label className="check">
          <input type="checkbox" checked={datos.publicado} onChange={(e) => cambiar('publicado', e.target.checked)} />
          <span>Publicar ahora (si lo desmarcas queda como borrador, que solo ves tú).</span>
        </label>
        <button className="btn" disabled={publicando}>
          {publicando ? 'Publicando…' : esMaterial ? 'Publicar material' : 'Publicar tarea'}
        </button>
      </form>

      <ListaGestionada titulo="Material publicado" tipo="materiales" items={materiales.items} cargando={materiales.cargando} grupoId={grupo.id} />
      <ListaGestionada titulo="Tareas publicadas" tipo="actividades" items={actividades.items} cargando={actividades.cargando} grupoId={grupo.id} />
        </>
      )}
    </>
  )
}

/** Tarjeta para que el docente cree su propia clase; queda como su docente. */
function CrearClase() {
  const { push } = useToast()
  const crear = useCrearGrupo()
  const [abierta, setAbierta] = useState(false)
  const [datos, setDatos] = useState({ nombre: '', descripcion: '', horario: '' })
  const [error, setError] = useState<string | null>(null)

  if (!abierta) {
    return (
      <motion.button type="button" className="clase-card nueva" onClick={() => setAbierta(true)} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
        <span className="clase-nueva-mas" aria-hidden="true">
          ＋
        </span>
        <b>Crear clase</b>
        <small>Una tarjeta nueva para tu asignatura</small>
      </motion.button>
    )
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    crear.mutate(datos, {
      onSuccess: (grupo) => {
        push(`Clase “${grupo.nombre}” creada`)
        setDatos({ nombre: '', descripcion: '', horario: '' })
        setAbierta(false)
      },
      onError: (err) => {
        if (err instanceof GrupoInvalido) return setError(err.message)
        if (err instanceof ErrorApi) return setError(err.campos.nombre?.[0] ?? err.detalle)
        return setError(err instanceof Error ? err.message : 'No se pudo crear la clase.')
      },
    })
  }

  return (
    <motion.form className="clase-card nueva-form" onSubmit={enviar} noValidate initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} aria-label="Crear clase">
      <b>Nueva clase</b>
      <label>
        Nombre de la asignatura *
        <input value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} maxLength={100} placeholder="Ej. Matemáticas 5°" />
      </label>
      <label>
        Descripción
        <input value={datos.descripcion} onChange={(e) => setDatos({ ...datos, descripcion: e.target.value })} placeholder="¿De qué trata la clase?" />
      </label>
      <label>
        Horario
        <input value={datos.horario} onChange={(e) => setDatos({ ...datos, horario: e.target.value })} maxLength={200} placeholder="Martes y jueves 2:00 p. m." />
      </label>
      {error && (
        <small className="field-err" role="alert">
          {error}
        </small>
      )}
      <div className="entrega-acciones">
        <button className="btn sm" disabled={crear.isPending}>
          {crear.isPending ? 'Creando…' : 'Crear'}
        </button>
        <button type="button" className="btn outline sm" onClick={() => setAbierta(false)}>
          Cancelar
        </button>
      </div>
    </motion.form>
  )
}

export default function GestionContenidoPage() {
  const { grupos, cargando } = useMisGrupos()
  const [params, setParams] = useSearchParams()
  const pedido = Number(params.get('grupo'))
  const indice = grupos.findIndex((g) => g.id === pedido)
  const activo = indice >= 0 ? grupos[indice] : undefined

  return (
    <>
      <p className="kicker">PORTAL DOCENTE / MIS CLASES</p>
      <h1 className="ptitle">Mis clases</h1>
      <p className="sub">
        Cada tarjeta es una asignatura. Publica material y tareas, revisa las entregas y califica. Solo los estudiantes con matrícula aprobada
        ven la clase.
      </p>
      {cargando ? (
        <p className="card">Cargando tus clases…</p>
      ) : activo ? (
        <ClaseDelDocente key={activo.id} grupo={activo} indice={indice} onVolver={() => setParams({})} />
      ) : (
        <TarjetasDeClases grupos={grupos} onAbrir={(g) => setParams({ grupo: String(g.id) })} pie={() => 'Gestionar clase'} extra={<CrearClase />} />
      )}
    </>
  )
}
