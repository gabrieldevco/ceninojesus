import { useState, type FormEvent } from 'react'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha } from '@/shared/lib/fecha'
import { Stat } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import {
  contarPorEstado,
  ESTADOS_DE_SOLICITUD,
  estaPendiente,
  estaVencida,
  ETIQUETA_DE_ESTADO,
  ETIQUETA_DE_TIPO,
  RespuestaRequerida,
  type EstadoDeSolicitud,
  type SolicitudDeDatos,
} from '../domain/solicitud'
import { useResponderSolicitud, useSolicitudesDeDatos, useTramitarSolicitud } from './DatosPersonalesProvider'

type Filtro = 'pendientes' | 'todas' | EstadoDeSolicitud

/** Reutiliza los colores de las insignias de matrícula. */
const CLASE_DE_ESTADO: Record<EstadoDeSolicitud, string> = { recibida: 'pendiente', en_tramite: 'coral', resuelta: 'aprobada' }

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof RespuestaRequerida) return error.message
  if (error instanceof ErrorApi) return error.detalle
  return porDefecto
}

function Detalle({ solicitud }: { solicitud: SolicitudDeDatos }) {
  const { push } = useToast()
  const tramitar = useTramitarSolicitud()
  const responder = useResponderSolicitud()
  const [respuesta, setRespuesta] = useState('')
  const [errorDeRespuesta, setErrorDeRespuesta] = useState<string | null>(null)
  const vencida = estaVencida(solicitud)

  const enviarRespuesta = (e: FormEvent) => {
    e.preventDefault()
    setErrorDeRespuesta(null)
    responder.mutate(
      { id: solicitud.id, respuesta },
      {
        onSuccess: () => {
          setRespuesta('')
          push('Respuesta enviada al titular')
        },
        onError: (error) =>
          error instanceof RespuestaRequerida ? setErrorDeRespuesta(error.message) : push(mensajeDeError(error, 'No se pudo responder.'), 'warn'),
      },
    )
  }

  return (
    <div className="card">
      <h3>
        {ETIQUETA_DE_TIPO[solicitud.tipo]} · {solicitud.nombre}
      </h3>
      <span className={`badge ${CLASE_DE_ESTADO[solicitud.estado]}`}>{ETIQUETA_DE_ESTADO[solicitud.estado]}</span>
      <p>
        <a href={`mailto:${solicitud.correo}`}>{solicitud.correo}</a>
        {solicitud.documentoIdentidad && <> · Documento {solicitud.documentoIdentidad}</>}
      </p>
      <p>“{solicitud.descripcion}”</p>
      <p className={vencida ? 'field-err' : 'muted-p'} role={vencida ? 'alert' : undefined}>
        Radicada el {formatearFecha(solicitud.fechaSolicitud)} · plazo legal hasta el {formatearFecha(solicitud.fechaLimite)}
        {vencida && ' · ¡plazo vencido!'}
      </p>
      {solicitud.tipo === 'supresion' && estaPendiente(solicitud) && (
        <p className="muted-p">Para suprimir sus datos, anonimiza la cuenta del titular en Usuarios y grupos y responde aquí.</p>
      )}

      {solicitud.estado === 'resuelta' ? (
        <>
          <b>Respuesta{solicitud.fechaRespuesta && ` (${formatearFecha(solicitud.fechaRespuesta)})`}</b>
          <p>{solicitud.respuesta}</p>
        </>
      ) : (
        <>
          {solicitud.estado === 'recibida' && (
            <button
              className="btn outline"
              disabled={tramitar.isPending}
              onClick={() =>
                tramitar.mutate(solicitud.id, {
                  onSuccess: () => push('Solicitud en trámite'),
                  onError: (error) => push(mensajeDeError(error, 'No se pudo cambiar el estado.'), 'warn'),
                })
              }
            >
              Marcar en trámite
            </button>
          )}
          <form className="form" onSubmit={enviarRespuesta} noValidate>
            <label>
              Respuesta al titular
              <textarea rows={4} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Se le enviará por correo" />
              {errorDeRespuesta && (
                <small className="field-err" role="alert">
                  {errorDeRespuesta}
                </small>
              )}
            </label>
            <button className="btn" disabled={responder.isPending}>
              Responder y cerrar
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function GestionSolicitudesDatosPage() {
  const { solicitudes, cargando, error } = useSolicitudesDeDatos()
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [elegidaId, setElegidaId] = useState<number | null>(null)

  const visibles = solicitudes.filter((s) =>
    filtro === 'todas' ? true : filtro === 'pendientes' ? estaPendiente(s) : s.estado === filtro,
  )
  // El detalle sigue el estado más reciente de la lista (cambia al actualizar)
  const elegida = solicitudes.find((s) => s.id === elegidaId) ?? null
  const vencidas = solicitudes.filter((s) => estaVencida(s)).length

  return (
    <>
      <p className="kicker">LEY 1581 / HABEAS DATA</p>
      <h1 className="ptitle">Solicitudes sobre datos personales</h1>
      <p className="sub">
        Consultas, actualizaciones, rectificaciones, supresiones y revocatorias de los titulares. La ley fija 10 días hábiles para las
        consultas y 15 para los reclamos; el sistema te avisa por correo de las que están por vencer.
      </p>

      <div className="stats">
        <Stat label="Recibidas" value={contarPorEstado(solicitudes, 'recibida')} hint="Sin tramitar todavía" tone="amber" />
        <Stat label="En trámite" value={contarPorEstado(solicitudes, 'en_tramite')} hint="Falta responder" tone="green" />
        <Stat label="Con plazo vencido" value={vencidas} hint="Respóndelas primero" tone={vencidas > 0 ? 'amber' : 'green'} />
      </div>

      <section className="card">
        <h3>Listado</h3>
        <div className="ftabs">
          <button className={filtro === 'pendientes' ? 'on' : ''} onClick={() => setFiltro('pendientes')}>
            Pendientes ({solicitudes.filter(estaPendiente).length})
          </button>
          {ESTADOS_DE_SOLICITUD.map((estado) => (
            <button key={estado} className={filtro === estado ? 'on' : ''} onClick={() => setFiltro(estado)}>
              {ETIQUETA_DE_ESTADO[estado]} ({contarPorEstado(solicitudes, estado)})
            </button>
          ))}
          <button className={filtro === 'todas' ? 'on' : ''} onClick={() => setFiltro('todas')}>
            Todas ({solicitudes.length})
          </button>
        </div>
        {cargando && <p className="muted-p">Cargando solicitudes…</p>}
        {error && <p className="muted-p">No pudimos cargar las solicitudes. Intenta de nuevo más tarde.</p>}
        <div className="tablewrap">
          <table className="sel">
            <thead>
              <tr>
                <th>Titular</th>
                <th>Tipo</th>
                <th>Plazo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((s) => (
                <tr key={s.id} className={s.id === elegidaId ? 'on' : ''} onClick={() => setElegidaId(s.id)}>
                  <td>
                    <b>{s.nombre}</b>
                    <br />
                    <small>{s.correo}</small>
                  </td>
                  <td>{ETIQUETA_DE_TIPO[s.tipo]}</td>
                  <td>
                    {formatearFecha(s.fechaLimite)}
                    {estaVencida(s) && <span className="badge rechazada">Vencida</span>}
                  </td>
                  <td>
                    <span className={`badge ${CLASE_DE_ESTADO[s.estado]}`}>{ETIQUETA_DE_ESTADO[s.estado]}</span>
                  </td>
                </tr>
              ))}
              {!cargando && visibles.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted-p">
                    No hay solicitudes con ese filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {elegida && <Detalle key={elegida.id} solicitud={elegida} />}
    </>
  )
}
