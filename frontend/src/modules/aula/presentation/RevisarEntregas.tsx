import { useState } from 'react'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha, formatearFechaHora } from '@/shared/lib/fecha'
import { useToast } from '@/shared/ui/toast'
import { esEnlaceSeguro, type Actividad } from '../domain/contenido'
import { CalificacionInvalida, resumenEntregas, type Entrega } from '../domain/entrega'
import { useCalificar, useDescargarEntrega, useEntregas } from './AulaProvider'

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof CalificacionInvalida) return error.message
  if (error instanceof ErrorApi) return error.campos.calificacion?.[0] ?? error.detalle
  if (error instanceof Error && error.message) return error.message
  return porDefecto
}

function FilaDeEntrega({ grupoId, entrega }: { grupoId: number; entrega: Entrega }) {
  const { push } = useToast()
  const calificar = useCalificar()
  const descargar = useDescargarEntrega()
  const [nota, setNota] = useState(entrega.calificacion?.toFixed(1) ?? '')
  const [comentario, setComentario] = useState(entrega.comentarioDocente)
  const idNota = `nota-${entrega.id}`

  const guardar = () =>
    calificar.mutate(
      { grupoId, actividadId: entrega.actividadId, entregaId: entrega.id, nota, comentario },
      {
        onSuccess: () => push(`Calificación guardada para ${entrega.estudianteNombre}`),
        onError: (error) => push(mensajeDeError(error, 'No se pudo guardar la calificación.'), 'warn'),
      },
    )

  return (
    <article className={`revision ${entrega.calificacion !== null ? 'calificada' : ''}`}>
      <header className="revision-cab">
        <span className="revision-avatar" aria-hidden="true">
          {entrega.estudianteNombre.charAt(0).toUpperCase()}
        </span>
        <div>
          <b>{entrega.estudianteNombre}</b>
          <small>
            Entregó el {formatearFechaHora(entrega.fechaEntrega)}
            {entrega.tarde && <span className="badge coral">Tarde</span>}
          </small>
        </div>
        <span className={`badge ${entrega.calificacion !== null ? 'aprobada' : 'pendiente'}`}>
          {entrega.calificacion !== null ? `${entrega.calificacion.toFixed(1)} / 5.0` : 'Por calificar'}
        </span>
      </header>
      <div className="revision-trabajo">
        {entrega.texto && <p className="entrega-texto">{entrega.texto}</p>}
        {entrega.url && esEnlaceSeguro(entrega.url) && (
          <a href={entrega.url} target="_blank" rel="noopener noreferrer">
            🔗 Abrir enlace entregado
          </a>
        )}
        {entrega.tieneArchivo && (
          <button
            type="button"
            className="btn outline sm"
            disabled={descargar.isPending}
            onClick={() =>
              descargar.mutate(
                { grupoId, actividadId: entrega.actividadId, entregaId: entrega.id, nombreSugerido: entrega.archivoNombre },
                { onError: (error) => push(mensajeDeError(error, 'No se pudo descargar el archivo.'), 'warn') },
              )
            }
          >
            📎 {descargar.isPending ? 'Descargando…' : `Descargar ${entrega.archivoNombre || 'archivo'}`}
          </button>
        )}
      </div>
      <div className="revision-calificar">
        <label htmlFor={idNota}>
          Nota (0.0 – 5.0)
          <input id={idNota} inputMode="decimal" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="4.5" maxLength={3} />
        </label>
        <label>
          Comentario para el estudiante
          <textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="¡Buen trabajo! Te sugiero…" />
        </label>
        <button type="button" className="btn sm" disabled={calificar.isPending} onClick={guardar}>
          {calificar.isPending ? 'Guardando…' : entrega.calificacion !== null ? 'Actualizar nota' : 'Calificar'}
        </button>
      </div>
    </article>
  )
}

/** El docente revisa las entregas de una actividad, las califica y las comenta. */
export function RevisarEntregas({ grupoId, actividades }: { grupoId: number; actividades: Actividad[] }) {
  const [elegida, setElegida] = useState<number | null>(null)
  const actividad = actividades.find((a) => a.id === elegida) ?? actividades[0]
  const entregas = useEntregas(grupoId, actividad?.id)
  const resumen = resumenEntregas(entregas.items)

  if (!actividad) return <p className="card">Publica una tarea para empezar a recibir entregas.</p>

  return (
    <div className="revisar">
      <nav className="revisar-lista" aria-label="Tareas de la clase">
        {actividades.map((a) => (
          <button key={a.id} type="button" className={a.id === actividad.id ? 'on' : ''} aria-current={a.id === actividad.id} onClick={() => setElegida(a.id)}>
            <b>{a.titulo}</b>
            <small>{a.fechaEntrega ? `Vence: ${formatearFecha(a.fechaEntrega)}` : 'Sin fecha'}</small>
          </button>
        ))}
      </nav>
      <section>
        <div className="stats revisar-stats">
          <div className="stat">
            <span>Entregas</span>
            <b>{resumen.total}</b>
          </div>
          <div className="stat amber">
            <span>Por calificar</span>
            <b>{resumen.porCalificar}</b>
          </div>
          <div className="stat green">
            <span>Promedio</span>
            <b>{resumen.promedio === null ? '—' : resumen.promedio.toFixed(1)}</b>
          </div>
        </div>
        {entregas.cargando && <p className="muted-p">Cargando entregas…</p>}
        {entregas.error && <p className="card">No pudimos cargar las entregas. Intenta de nuevo.</p>}
        {!entregas.cargando && !entregas.error && entregas.items.length === 0 && (
          <p className="card">Nadie ha entregado “{actividad.titulo}” todavía.</p>
        )}
        {entregas.items.map((e) => (
          <FilaDeEntrega key={`${e.id}-${e.calificacion ?? 'x'}`} grupoId={grupoId} entrega={e} />
        ))}
      </section>
    </div>
  )
}
