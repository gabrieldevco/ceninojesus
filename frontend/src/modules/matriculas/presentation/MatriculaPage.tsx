import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { formatearFecha } from '@/shared/lib/fecha'
import { Alert, Stat, StatusBadge } from '@/shared/ui/ui'
import { useToast } from '@/shared/ui/toast'
import { useAuth } from '@/modules/auth'
import { useGrupos } from '@/modules/grupos'
import { contarPorEstado, SolicitudDuplicada } from '../domain/solicitud'
import { useEnviarSolicitud, useEstudiantes, useSolicitudes } from './MatriculasProvider'

interface Formulario {
  estudiante: string
  grupo: string
  acudiente: string
  correo: string
  telefono: string
}

export default function MatriculaPage() {
  const { usuario } = useAuth()
  const { push } = useToast()
  const { solicitudes } = useSolicitudes()
  const { grupos } = useGrupos()
  const estudiantes = useEstudiantes()
  const enviar = useEnviarSolicitud()

  const mias = solicitudes.filter((s) => s.acudiente === usuario?.nombre)
  const [campos, setCampos] = useState<Formulario>({
    estudiante: '',
    grupo: 'Robótica',
    acudiente: usuario?.nombre ?? '',
    correo: 'familia.a@example.com',
    telefono: '',
  })
  const [enviada, setEnviada] = useState<string | null>(null)
  const cambiar = (campo: keyof Formulario) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCampos({ ...campos, [campo]: e.target.value })
  const estudiante = campos.estudiante || estudiantes[0] || ''

  const enviarSolicitud = (e: FormEvent) => {
    e.preventDefault()
    enviar.mutate(
      { estudiante, grupo: campos.grupo, acudiente: campos.acudiente, correo: campos.correo },
      {
        onSuccess: () => {
          setEnviada(`${campos.grupo} · ${estudiante}`)
          push('Solicitud enviada: queda pendiente de revisión')
        },
        onError: (error) =>
          push(error instanceof SolicitudDuplicada ? error.message : 'No se pudo enviar la solicitud', 'warn'),
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
          <div className="row2">
            <label>
              Estudiante *
              <select value={estudiante} onChange={cambiar('estudiante')}>
                {estudiantes.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <small>Solo estudiantes vinculados a tu cuenta.</small>
            </label>
            <label>
              Grupo solicitado *
              <select value={campos.grupo} onChange={cambiar('grupo')}>
                {grupos.map((g) => (
                  <option key={g.nombre}>{g.nombre}</option>
                ))}
              </select>
              <small>Oferta, cupos y condiciones por confirmar.</small>
            </label>
          </div>
          <h4>Datos del acudiente</h4>
          <label>
            Nombre del acudiente *
            <input required value={campos.acudiente} onChange={cambiar('acudiente')} />
          </label>
          <div className="row2">
            <label>
              Correo para el resultado *
              <input type="email" required value={campos.correo} onChange={cambiar('correo')} />
            </label>
            <label>
              Teléfono de contacto
              <input value={campos.telefono} onChange={cambiar('telefono')} placeholder="Escribe aquí" />
              <small>Opcional, si requiere llamada.</small>
            </label>
          </div>
          <button className="btn" disabled={enviar.isPending}>
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
        <p className="muted-p">Estados y fechas de demostración; no representan matrículas reales.</p>
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
                        <Link className="go" to={`/estudiante/aula?grupo=${encodeURIComponent(s.grupo)}`}>
                          Abrir grupo →
                        </Link>
                      ) : s.estado === 'pendiente' ? (
                        'Bloqueado · En revisión'
                      ) : (
                        `Motivo: ${s.motivo || 'no especificado'}`
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
