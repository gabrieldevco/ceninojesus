import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Alert, Stat, StatusBadge } from '../components/ui'
import { useRequests, useToast } from '../store'
import { fmtDate } from '../data/demo'

const TABS = [['todas', 'Todas'], ['pendiente', 'Pendiente'], ['aprobada', 'Aprobada'], ['rechazada', 'Rechazada']]

export default function Solicitudes() {
  const { requests, dispatch } = useRequests(); const { push } = useToast()
  const list = useMemo(() => requests.filter(r => r.group === 'Robótica'), [requests])
  const [tab, setTab] = useState('todas'); const [q, setQ] = useState('')
  const [selId, setSelId] = useState(list.find(r => r.status === 'pendiente')?.id)
  const [reason, setReason] = useState(''); const [confirm, setConfirm] = useState(null); const [done, setDone] = useState(null)
  const count = s => list.filter(r => r.status === s).length
  const shown = list.filter(r => (tab === 'todas' || r.status === tab) && (r.student + r.guardian).toLowerCase().includes(q.toLowerCase()))
  const sel = list.find(r => r.id === selId)
  const pick = id => { setSelId(id); setConfirm(null); setReason(''); setDone(null) }

  const start = kind => {
    if (kind === 'rechazar' && reason.trim().length < 5) return push('El rechazo requiere un motivo claro', 'warn')
    setConfirm(kind)
  }
  const apply = () => {
    const status = confirm === 'aprobar' ? 'aprobada' : 'rechazada'
    dispatch({ type: 'resolve', id: sel.id, status, reason: status === 'rechazada' ? reason.trim() : undefined })
    setDone(`${sel.student}: solicitud ${status}. Se informó el resultado al acudiente${status === 'rechazada' ? ' junto con el motivo' : ''}.`)
    push(`Solicitud ${status}`, status === 'aprobada' ? 'ok' : 'warn'); setConfirm(null); setReason('')
  }

  return (
    <>
      <p className="kicker">GRUPO ASIGNADO / ROBÓTICA / SOLICITUDES</p>
      <h1 className="ptitle">Revisar solicitudes de matrícula</h1>
      <p className="sub">Gestiona únicamente las solicitudes del grupo asignado. La aprobación habilita el acceso; el rechazo requiere un motivo para el acudiente.</p>
      {count('pendiente') > 0 && <Alert tone="info" title="Nueva solicitud · Notificación de ejemplo">Hay {count('pendiente')} solicitudes pendientes de revisión en Robótica.</Alert>}
      <div className="stats">
        <Stat label="Pendientes" value={count('pendiente')} hint="Requieren revisión" tone="amber" />
        <Stat label="Aprobadas" value={count('aprobada')} hint="Acceso al grupo habilitado" tone="green" />
        <Stat label="Rechazadas" value={count('rechazada')} hint="Resultado con motivo" tone="red" />
      </div>
      <section className="card">
        <h3>Solicitudes del grupo</h3>
        <div className="row2"><label>Buscar solicitud<input value={q} onChange={e => setQ(e.target.value)} placeholder="Estudiante o acudiente" /></label>
          <label>Grupo asignado<input readOnly value="Robótica · Solo lectura" /></label></div>
        <div className="ftabs">{TABS.map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t} ({k === 'todas' ? list.length : count(k)})</button>)}</div>
        <div className="tablewrap"><table className="sel">
          <thead><tr><th>Estudiante</th><th>Acudiente</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            <AnimatePresence initial={false}>
              {shown.map(r => (
                <motion.tr key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={r.id === selId ? 'on' : ''} onClick={() => pick(r.id)}>
                  <td><b className="blue">{r.student}</b></td><td>{r.guardian}</td><td>{fmtDate(r.date)}</td><td><StatusBadge status={r.status} /></td>
                  <td>{r.id === selId ? 'Detalle abierto' : r.status === 'pendiente' ? 'Revisar →' : r.status === 'aprobada' ? 'Ver resultado →' : 'Ver motivo →'}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {shown.length === 0 && <tr><td colSpan="5" className="empty">Sin resultados</td></tr>}
          </tbody>
        </table></div>
      </section>

      <AnimatePresence mode="wait">
        {sel && (
          <motion.div key={sel.id} className="two" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card">
              <h3>Detalle · {sel.student}</h3><StatusBadge status={sel.status} />
              <p>Grupo: {sel.group} · Solicitado el {fmtDate(sel.date)}. Acudiente: {sel.guardian} · {sel.email}.</p>
              {sel.status === 'pendiente' ? (<>
                <label>Motivo de rechazo<textarea rows="4" value={reason} onChange={e => setReason(e.target.value)} placeholder="Escribe aquí" /><small>Obligatorio si rechazas. Sin datos sensibles.</small></label>
                <div className="btns"><button className="btn" onClick={() => start('aprobar')}>Aprobar solicitud</button><button className="btn outline" onClick={() => start('rechazar')}>Rechazar con motivo</button></div>
              </>) : <p className="muted-p">{sel.status === 'rechazada' ? `Motivo: ${sel.reason}` : 'Solicitud ya resuelta.'}</p>}
            </div>
            <div className="card">
              <h3>Confirmación</h3>
              {!confirm && !done && <p className="muted-p">Elige una acción para confirmarla aquí.</p>}
              {confirm && (
                <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
                  <h4 className={confirm === 'rechazar' ? 'red' : ''}>{confirm === 'aprobar' ? '¿Aprobar esta solicitud?' : '¿Rechazar esta solicitud?'}</h4>
                  <p>{confirm === 'aprobar' ? `Se habilitará el acceso de ${sel.student} a Robótica y se notificará el resultado al acudiente.` : `Motivo: ${reason}. El acudiente recibirá el resultado y el acceso seguirá bloqueado.`}</p>
                  <div className="btns"><button className="btn" onClick={apply}>{confirm === 'aprobar' ? 'Confirmar' : 'Confirmar rechazo'}</button><button className="btn outline" onClick={() => setConfirm(null)}>Cancelar</button></div>
                </motion.div>
              )}
              {done && <Alert tone="ok" title="Resultado comunicado">{done}</Alert>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
