import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { formatearFecha } from '@/shared/lib/fecha'
import { Alert, Stat, StatusBadge } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { contarPorEstado, MOTIVO_MINIMO_CARACTERES, MotivoRequerido, type EstadoSolicitud } from '../domain/solicitud'
import { useResolverSolicitud, useSolicitudes } from './MatriculasProvider'

/** En la demostración el administrador tiene asignado un único grupo. */
const GRUPO_ASIGNADO = 'Robótica'

type Filtro = 'todas' | EstadoSolicitud
type Accion = 'aprobar' | 'rechazar'
const FILTROS: [Filtro, string][] = [
  ['todas', 'Todas'],
  ['pendiente', 'Pendiente'],
  ['aprobada', 'Aprobada'],
  ['rechazada', 'Rechazada'],
]

export default function SolicitudesPage() {
  const { push } = useToast()
  const { solicitudes } = useSolicitudes()
  const resolver = useResolverSolicitud()
  const lista = useMemo(() => solicitudes.filter((s) => s.grupo === GRUPO_ASIGNADO), [solicitudes])

  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [elegidaId, setElegidaId] = useState<number | undefined>(undefined)
  const [motivo, setMotivo] = useState('')
  const [accion, setAccion] = useState<Accion | null>(null)
  const [resultado, setResultado] = useState<string | null>(null)

  const elegida = lista.find((s) => s.id === (elegidaId ?? lista.find((x) => x.estado === 'pendiente')?.id))
  const visibles = lista.filter(
    (s) => (filtro === 'todas' || s.estado === filtro) && (s.estudiante + s.acudiente).toLowerCase().includes(busqueda.toLowerCase()),
  )
  const pendientes = contarPorEstado(lista, 'pendiente')

  const elegir = (id: number) => {
    setElegidaId(id)
    setAccion(null)
    setMotivo('')
    setResultado(null)
  }

  const iniciar = (tipo: Accion) => {
    if (tipo === 'rechazar' && motivo.trim().length < MOTIVO_MINIMO_CARACTERES) return push(new MotivoRequerido().message, 'warn')
    return setAccion(tipo)
  }

  const aplicar = () => {
    if (!elegida || !accion) return
    const estado = accion === 'aprobar' ? 'aprobada' : 'rechazada'
    resolver.mutate(
      accion === 'aprobar' ? { id: elegida.id } : { id: elegida.id, motivo },
      {
        onSuccess: () => {
          setResultado(
            `${elegida.estudiante}: solicitud ${estado}. Se informó el resultado al acudiente${estado === 'rechazada' ? ' junto con el motivo' : ''}.`,
          )
          push(`Solicitud ${estado}`, estado === 'aprobada' ? 'ok' : 'warn')
          setAccion(null)
          setMotivo('')
        },
        onError: (error) => push(error instanceof MotivoRequerido ? error.message : 'No se pudo guardar el resultado', 'warn'),
      },
    )
  }

  return (
    <>
      <p className="kicker">GRUPO ASIGNADO / ROBÓTICA / SOLICITUDES</p>
      <h1 className="ptitle">Revisar solicitudes de matrícula</h1>
      <p className="sub">
        Gestiona únicamente las solicitudes del grupo asignado. La aprobación habilita el acceso; el rechazo requiere un motivo
        para el acudiente.
      </p>
      {pendientes > 0 && (
        <Alert tone="info" title="Nueva solicitud · Notificación de ejemplo">
          Hay {pendientes} solicitudes pendientes de revisión en Robótica.
        </Alert>
      )}
      <div className="stats">
        <Stat label="Pendientes" value={pendientes} hint="Requieren revisión" tone="amber" />
        <Stat label="Aprobadas" value={contarPorEstado(lista, 'aprobada')} hint="Acceso al grupo habilitado" tone="green" />
        <Stat label="Rechazadas" value={contarPorEstado(lista, 'rechazada')} hint="Resultado con motivo" tone="red" />
      </div>
      <section className="card">
        <h3>Solicitudes del grupo</h3>
        <div className="row2">
          <label>
            Buscar solicitud
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Estudiante o acudiente" />
          </label>
          <label>
            Grupo asignado
            <input readOnly value="Robótica · Solo lectura" />
          </label>
        </div>
        <div className="ftabs">
          {FILTROS.map(([clave, titulo]) => (
            <button key={clave} className={filtro === clave ? 'on' : ''} onClick={() => setFiltro(clave)}>
              {titulo} ({clave === 'todas' ? lista.length : contarPorEstado(lista, clave)})
            </button>
          ))}
        </div>
        <div className="tablewrap">
          <table className="sel">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Acudiente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visibles.map((s) => (
                  <motion.tr
                    key={s.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={s.id === elegida?.id ? 'on' : ''}
                    onClick={() => elegir(s.id)}
                  >
                    <td>
                      <b className="blue">{s.estudiante}</b>
                    </td>
                    <td>{s.acudiente}</td>
                    <td>{formatearFecha(s.fecha)}</td>
                    <td>
                      <StatusBadge status={s.estado} />
                    </td>
                    <td>
                      {s.id === elegida?.id
                        ? 'Detalle abierto'
                        : s.estado === 'pendiente'
                          ? 'Revisar →'
                          : s.estado === 'aprobada'
                            ? 'Ver resultado →'
                            : 'Ver motivo →'}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {visibles.length === 0 && (
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

      <AnimatePresence mode="wait">
        {elegida && (
          <motion.div key={elegida.id} className="two" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card">
              <h3>Detalle · {elegida.estudiante}</h3>
              <StatusBadge status={elegida.estado} />
              <p>
                Grupo: {elegida.grupo} · Solicitado el {formatearFecha(elegida.fecha)}. Acudiente: {elegida.acudiente} ·{' '}
                {elegida.correo}.
              </p>
              {elegida.estado === 'pendiente' ? (
                <>
                  <label>
                    Motivo de rechazo
                    <textarea rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Escribe aquí" />
                    <small>Obligatorio si rechazas. Sin datos sensibles.</small>
                  </label>
                  <div className="btns">
                    <button className="btn" onClick={() => iniciar('aprobar')}>
                      Aprobar solicitud
                    </button>
                    <button className="btn outline" onClick={() => iniciar('rechazar')}>
                      Rechazar con motivo
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted-p">
                  {elegida.estado === 'rechazada' ? `Motivo: ${elegida.motivo}` : 'Solicitud ya resuelta.'}
                </p>
              )}
            </div>
            <div className="card">
              <h3>Confirmación</h3>
              {!accion && !resultado && <p className="muted-p">Elige una acción para confirmarla aquí.</p>}
              {accion && (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <h4 className={accion === 'rechazar' ? 'red' : ''}>
                    {accion === 'aprobar' ? '¿Aprobar esta solicitud?' : '¿Rechazar esta solicitud?'}
                  </h4>
                  <p>
                    {accion === 'aprobar'
                      ? `Se habilitará el acceso de ${elegida.estudiante} a Robótica y se notificará el resultado al acudiente.`
                      : `Motivo: ${motivo}. El acudiente recibirá el resultado y el acceso seguirá bloqueado.`}
                  </p>
                  <div className="btns">
                    <button className="btn" onClick={aplicar} disabled={resolver.isPending}>
                      {accion === 'aprobar' ? 'Confirmar' : 'Confirmar rechazo'}
                    </button>
                    <button className="btn outline" onClick={() => setAccion(null)}>
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}
              {resultado && (
                <Alert tone="ok" title="Resultado comunicado">
                  {resultado}
                </Alert>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
