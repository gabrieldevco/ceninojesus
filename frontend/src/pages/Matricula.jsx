import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Alert, Stat, StatusBadge } from '../components/ui'
import { useRequests, useToast } from '../store'
import { GROUPS, STUDENTS, fmtDate } from '../data/demo'

export default function Matricula() {
  const { requests, dispatch } = useRequests(); const { push } = useToast()
  const mine = requests.filter(r => r.guardian === 'Acudiente demo A')
  const count = s => mine.filter(r => r.status === s).length
  const [f, setF] = useState({ student: STUDENTS[0], group: 'Robótica', guardian: 'Acudiente demo A', email: 'familia.a@example.com', phone: '' })
  const [sent, setSent] = useState(null)
  const set = k => e => setF({ ...f, [k]: e.target.value })

  const dup = mine.find(r => r.student === f.student && r.group === f.group && r.status !== 'rechazada')
  const submit = e => {
    e.preventDefault()
    if (dup) return push(`Ya existe una solicitud ${dup.status} para ${f.student} en ${f.group}`, 'warn')
    dispatch({ type: 'add', req: { student: f.student, group: f.group, guardian: f.guardian, email: f.email } })
    setSent(`${f.group} · ${f.student}`); push('Solicitud enviada: queda pendiente de revisión')
  }

  return (
    <>
      <p className="kicker">FAMILIAS / GRUPOS EXTRACURRICULARES</p>
      <h1 className="ptitle">Un nuevo espacio para sus talentos</h1>
      <p className="sub">Solicite la matrícula extracurricular y consulte el resultado. Solo los grupos aprobados habilitan el acceso al aula del estudiante.</p>
      <div className="stats">
        <Stat label="Pendiente" value={count('pendiente')} hint="En revisión por el administrador" tone="amber" />
        <Stat label="Aprobada" value={count('aprobada')} hint="Acceso al grupo habilitado" tone="green" />
        <Stat label="Rechazada" value={count('rechazada')} hint="Consulta el motivo del resultado" tone="red" />
      </div>
      <div className="two">
        <form className="card form" onSubmit={submit}>
          <h3>Solicitar matrícula</h3>
          <div className="row2">
            <label>Estudiante *<select value={f.student} onChange={set('student')}>{STUDENTS.map(s => <option key={s}>{s}</option>)}</select><small>Solo estudiantes vinculados a tu cuenta.</small></label>
            <label>Grupo solicitado *<select value={f.group} onChange={set('group')}>{GROUPS.map(s => <option key={s}>{s}</option>)}</select><small>Oferta, cupos y condiciones por confirmar.</small></label>
          </div>
          <h4>Datos del acudiente</h4>
          <label>Nombre del acudiente *<input required value={f.guardian} onChange={set('guardian')} /></label>
          <div className="row2">
            <label>Correo para el resultado *<input type="email" required value={f.email} onChange={set('email')} /></label>
            <label>Teléfono de contacto<input value={f.phone} onChange={set('phone')} placeholder="Escribe aquí" /><small>Opcional, si requiere llamada.</small></label>
          </div>
          <button className="btn">Enviar solicitud de matrícula</button>
          <AnimatePresence>{sent && <Alert tone="ok" title="Solicitud enviada">{sent}. Queda Pendiente. El administrador recibe el aviso y el acudiente será notificado del resultado.</Alert>}</AnimatePresence>
        </form>
        <aside className="card">
          <h3>¿Qué significa cada estado?</h3>
          <StatusBadge status="pendiente" /><p>Solicitud recibida. El acceso al grupo permanece bloqueado.</p>
          <StatusBadge status="aprobada" /><p>El estudiante puede consultar material y actividades.</p>
          <StatusBadge status="rechazada" /><p>Se informa un motivo. No se habilita el acceso.</p>
        </aside>
      </div>
      <section className="card">
        <h3>Mis solicitudes</h3>
        <p className="muted-p">Estados y fechas de demostración; no representan matrículas reales.</p>
        <div className="tablewrap"><table>
          <thead><tr><th>Estudiante</th><th>Grupo</th><th>Fecha</th><th>Estado</th><th>Acceso / resultado</th></tr></thead>
          <tbody>
            <AnimatePresence initial={false}>
              {mine.map(r => (
                <motion.tr key={r.id} layout initial={{ opacity: 0, backgroundColor: '#fde9e6' }} animate={{ opacity: 1, backgroundColor: 'rgba(255,255,255,0)' }} transition={{ duration: .8 }}>
                  <td><b className="blue">{r.student}</b></td><td>{r.group}</td><td>{fmtDate(r.date)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.status === 'aprobada' ? <Link className="go" to={`/estudiante/aula?grupo=${encodeURIComponent(r.group)}`}>Abrir grupo →</Link>
                    : r.status === 'pendiente' ? 'Bloqueado · En revisión' : `Motivo: ${r.reason || 'no especificado'}`}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table></div>
      </section>
    </>
  )
}
