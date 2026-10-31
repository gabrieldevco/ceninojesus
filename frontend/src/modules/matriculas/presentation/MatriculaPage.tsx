import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ErrorApi } from '@/shared/http/errores'
import { formatearFecha } from '@/shared/lib/fecha'
import { Alert, Stat, StatusBadge } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { useEstudiantes } from '@/modules/estudiantes'
import { useGrupos } from '@/modules/grupos'
import { contarPorEstado, SolicitudDuplicada } from '../domain/solicitud'
import { useEnviarSolicitud, useSolicitudes } from './MatriculasProvider'

function mensajeDeError(error: unknown): string {
  if (error instanceof SolicitudDuplicada) return error.message
  if (error instanceof ErrorApi) return error.detalle
  return 'No se pudo enviar la solicitud. Intenta de nuevo.'
}

export default function MatriculaPage() {
  const { push } = useToast()
  const { solicitudes: mias } = useSolicitudes()
  const { grupos } = useGrupos()
  const { estudiantes } = useEstudiantes()
  const enviar = useEnviarSolicitud()

  // Elegidos por el usuario; mientras no elija, se propone el primero de cada lista
  const [estudianteElegido, setEstudianteElegido] = useState<number | null>(null)
  const [grupoElegido, setGrupoElegido] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [enviada, setEnviada] = useState<string | null>(null)

  const estudianteId = estudianteElegido ?? estudiantes[0]?.id
  const grupoId = grupoElegido ?? grupos[0]?.id

  const enviarSolicitud = (e: FormEvent) => {
    e.preventDefault()
    if (estudianteId === undefined || grupoId === undefined) return
    const estudiante = estudiantes.find((x) => x.id === estudianteId)?.nombre ?? ''
    const grupo = grupos.find((x) => x.id === grupoId)?.nombre ?? ''
    enviar.mutate(
      { estudianteId, grupoId, comentario: comentario.trim() },
      {
        onSuccess: () => {
          setEnviada(`${grupo} · ${estudiante}`)
          setComentario('')
          push('Solicitud enviada: queda pendiente de revisión')
        },
        onError: (error) => push(mensajeDeError(error), 'warn'),
      },
    )
  }

  return (
    <>
      <p className="kicker">FAMILIAS / GRUPOS EXTRACURRICULARES</p>
      <h1 className="ptitle">Un nuevo espacio para sus talentos</h1>
      <p className="sub">
        Solicite la matrícula extracurricular y consulte el resultado. Solo los grupos aprobados habilitan el acceso al aula del
        estudiante.
      </p>
      <div className="stats">
        <Stat label="Pendiente" value={contarPorEstado(mias, 'pendiente')} hint="En revisión por el administrador" tone="amber" />
        <Stat label="Aprobada" value={contarPorEstado(mias, 'aprobada')} hint="Acceso al grupo habilitado" tone="green" />
        <Stat label="Rechazada" value={contarPorEstado(mias, 'rechazada')} hint="Consulta el motivo del resultado" tone="red" />
      </div>
      <div className="two">
        <form className="card form" onSubmit={enviarSolicitud}>
          <h3>Solicitar matrícula</h3>
          {estudiantes.length === 0 && (
            <Alert tone="info" title="Sin estudiantes vinculados">
              Para solicitar una matrícula, primero <Link className="go" to="/familias/estudiantes">registra a tu estudiante →</Link>
            </Alert>
          )}
          <div className="row2">
            <label>
              Estudiante *
              <select value={estudianteId ?? ''} onChange={(e) => setEstudianteElegido(Number(e.target.value))} required>
                {estudiantes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <small>Solo estudiantes vinculados a tu cuenta.</small>
            </label>
            <label>
              Grupo solicitado *
              <select value={grupoId ?? ''} onChange={(e) => setGrupoElegido(Number(e.target.value))} required>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
              <small>Oferta, cupos y condiciones por confirmar.</small>
            </label>
          </div>
          <label>
            Comentario
            <textarea
              rows={3}
              maxLength={500}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Opcional: algo que el administrador del grupo deba saber"
            />
          </label>
          <button className="btn" disabled={enviar.isPending || estudianteId === undefined || grupoId === undefined}>
            Enviar solicitud de matrícula
          </button>
          <AnimatePresence>
            {enviada && (
              <Alert tone="ok" title="Solicitud enviada">
                {enviada}. Queda Pendiente. El administrador recibe el aviso y el acudiente será notificado del resultado.
              </Alert>
            )}
          </AnimatePresence>
        </form>
        <aside className="card">
          <h3>¿Qué significa cada estado?</h3>
          <StatusBadge status="pendiente" />
          <p>Solicitud recibida. El acceso al grupo permanece bloqueado.</p>
          <StatusBadge status="aprobada" />
          <p>El estudiante puede consultar material y actividades.</p>
          <StatusBadge status="rechazada" />
          <p>Se informa un motivo. No se habilita el acceso.</p>
        </aside>
      </div>
      <section className="card">
        <h3>Mis solicitudes</h3>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Grupo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acceso / resultado</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {mias.map((s) => (
                  <motion.tr
                    key={s.id}
                    layout
                    initial={{ opacity: 0, backgroundColor: '#fde9e6' }}
                    animate={{ opacity: 1, backgroundColor: 'rgba(255,255,255,0)' }}
                    transition={{ duration: 0.8 }}
                  >
                    <td>
                      <b className="blue">{s.estudiante}</b>
                    </td>
                    <td>{s.grupo}</td>
                    <td>{formatearFecha(s.fecha)}</td>
                    <td>
                      <StatusBadge status={s.estado} />
                    </td>
                    <td>
                      {s.estado === 'aprobada' ? (
                        'Aprobada · el estudiante accede con su cuenta'
                      ) : s.estado === 'pendiente' ? (
                        'Bloqueado · En revisión'
                      ) : (
                        `Motivo: ${s.motivo || 'no especificado'}`
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {mias.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Aún no has enviado solicitudes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
