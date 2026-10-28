import { useState, type FormEvent } from 'react'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha } from '@/shared/lib/fecha'
import { Stat } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import {
  contarPorEstado,
  ESTADOS_DE_INTERESADO,
  ETIQUETA_DE_ESTADO,
  NotaRequerida,
  transicionesPermitidas,
  type EstadoInteresado,
  type Interesado,
} from '../domain/interesado'
import { useCambiarEstado, useInteresados, useRegistrarSeguimiento, useSeguimientos } from './InteresadosProvider'

type Filtro = 'todos' | EstadoInteresado

/** Reutiliza los colores de las insignias de matrícula. */
const CLASE_DE_ESTADO: Record<EstadoInteresado, string> = {
  nuevo: 'pendiente',
  en_seguimiento: 'coral',
  matriculado: 'aprobada',
  descartado: 'rechazada',
}

const Insignia = ({ estado }: { estado: EstadoInteresado }) => (
  <span className={`badge ${CLASE_DE_ESTADO[estado]}`}>{ETIQUETA_DE_ESTADO[estado]}</span>
)

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (error instanceof NotaRequerida) return error.message
  if (error instanceof ErrorApi) return error.detalle
  return porDefecto
}

function Detalle({ interesado }: { interesado: Interesado }) {
  const { push } = useToast()
  const cambiarEstado = useCambiarEstado()
  const registrar = useRegistrarSeguimiento()
  const { seguimientos, cargando } = useSeguimientos(interesado.id)
  const [nota, setNota] = useState('')
  const [errorDeNota, setErrorDeNota] = useState<string | null>(null)
  const siguientes = transicionesPermitidas(interesado.estado)

  const anotar = (e: FormEvent) => {
    e.preventDefault()
    setErrorDeNota(null)
    registrar.mutate(
      { interesadoId: interesado.id, nota },
      {
        onSuccess: () => {
          setNota('')
          push('Seguimiento registrado')
        },
        onError: (error) =>
          error instanceof NotaRequerida ? setErrorDeNota(error.message) : push(mensajeDeError(error, 'No se pudo guardar la nota.'), 'warn'),
      },
    )
  }

  return (
    <div className="two">
      <div className="card">
        <h3>{interesado.nombreCompleto}</h3>
        <Insignia estado={interesado.estado} />
        <p>
          <a href={`mailto:${interesado.correo}`}>{interesado.correo}</a> · <a href={`tel:${interesado.telefono}`}>{interesado.telefono}</a>
        </p>
        <p>
          Interés: {interesado.gradoInteres || 'sin indicar'}
          {interesado.nombreAspirante && <> · Aspirante: {interesado.nombreAspirante}</>}
        </p>
        <p className="muted-p">
          Registrado el {formatearFecha(interesado.fechaRegistro)} ·{' '}
          {interesado.fechaUltimoContacto ? `último contacto el ${formatearFecha(interesado.fechaUltimoContacto)}` : 'sin contacto todavía'}
        </p>
        {interesado.mensaje && <p>“{interesado.mensaje}”</p>}
        {siguientes.length > 0 ? (
          <>
            <b>Cambiar estado</b>
            <div className="btns">
              {siguientes.map((estado) => (
                <button
                  key={estado}
                  className={estado === 'descartado' ? 'btn outline' : 'btn'}
                  disabled={cambiarEstado.isPending}
                  onClick={() =>
                    cambiarEstado.mutate(
                      { interesado, estado },
                      {
                        onSuccess: () => push(`${interesado.nombreCompleto}: ${ETIQUETA_DE_ESTADO[estado].toLowerCase()}`),
                        onError: (error) => push(mensajeDeError(error, 'No se pudo cambiar el estado.'), 'warn'),
                      },
                    )
                  }
                >
                  Pasar a {ETIQUETA_DE_ESTADO[estado].toLowerCase()}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted-p">Este estado es final: ya no admite cambios.</p>
        )}
      </div>

      <div className="card">
        <h3>Seguimiento</h3>
        <form className="form" onSubmit={anotar} noValidate>
          <label>
            Nota del contacto
            <textarea rows={3} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Qué se habló y qué sigue" />
            {errorDeNota && (
              <small className="field-err" role="alert">
                {errorDeNota}
              </small>
            )}
          </label>
          <button className="btn" disabled={registrar.isPending}>
            Registrar seguimiento
          </button>
        </form>
        {cargando && <p className="muted-p">Cargando…</p>}
        {!cargando && seguimientos.length === 0 && <p className="muted-p">Aún no hay seguimientos.</p>}
        <ul className="seguimientos">
          {seguimientos.map((s) => (
            <li key={s.id}>
              <small>{formatearFecha(s.fecha)}</small>
              <p>{s.nota}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function GestionInteresadosPage() {
  const { interesados, cargando, error } = useInteresados()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [elegidoId, setElegidoId] = useState<number | null>(null)

  const visibles = interesados.filter(
    (i) =>
      (filtro === 'todos' || i.estado === filtro) &&
      `${i.nombreCompleto} ${i.correo} ${i.telefono} ${i.nombreAspirante}`.toLowerCase().includes(busqueda.toLowerCase()),
  )
  // El detalle sigue el estado más reciente de la lista (cambia al actualizar)
  const elegido = interesados.find((i) => i.id === elegidoId) ?? null

  return (
    <>
      <p className="kicker">ADMISIONES / INTERESADOS</p>
      <h1 className="ptitle">Interesados en la matrícula</h1>
      <p className="sub">
        Personas que dejaron sus datos en el formulario de admisiones. Registra cada contacto y actualiza su estado; el sistema envía
        recordatorios de los que llevan días sin respuesta.
      </p>

      <div className="stats">
        <Stat label="Nuevos" value={contarPorEstado(interesados, 'nuevo')} hint="Sin contactar todavía" tone="amber" />
        <Stat label="En seguimiento" value={contarPorEstado(interesados, 'en_seguimiento')} hint="Ya se les contactó" tone="green" />
        <Stat label="Matriculados" value={contarPorEstado(interesados, 'matriculado')} hint="Se convirtieron en estudiantes" tone="green" />
      </div>

      <section className="card">
        <h3>Listado</h3>
        <div className="row2">
          <label>
            Buscar
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, correo o teléfono" />
          </label>
        </div>
        <div className="ftabs">
          <button className={filtro === 'todos' ? 'on' : ''} onClick={() => setFiltro('todos')}>
            Todos ({interesados.length})
          </button>
          {ESTADOS_DE_INTERESADO.map((estado) => (
            <button key={estado} className={filtro === estado ? 'on' : ''} onClick={() => setFiltro(estado)}>
              {ETIQUETA_DE_ESTADO[estado]} ({contarPorEstado(interesados, estado)})
            </button>
          ))}
        </div>
        {cargando && <p className="muted-p">Cargando interesados…</p>}
        {error && <p className="muted-p">No pudimos cargar los interesados. Intenta de nuevo más tarde.</p>}
        <div className="tablewrap">
          <table className="sel">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Interés</th>
                <th>Registro</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((i) => (
                <tr key={i.id} className={i.id === elegido?.id ? 'on' : ''} onClick={() => setElegidoId(i.id)}>
                  <td>
                    <b className="blue">{i.nombreCompleto}</b>
                  </td>
                  <td>{i.telefono}</td>
                  <td>{i.gradoInteres || '—'}</td>
                  <td>{formatearFecha(i.fechaRegistro)}</td>
                  <td>
                    <Insignia estado={i.estado} />
                  </td>
                </tr>
              ))}
              {!cargando && visibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {elegido && <Detalle key={elegido.id} interesado={elegido} />}
    </>
  )
}
