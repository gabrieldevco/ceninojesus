import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatearFechaHora } from '@/shared/lib/fecha'
import { useToast } from '@/shared/ui/toast'
import { useMarcarMensajeContactoLeido, useMensajesContacto } from './InstitucionalProvider'

/** Celulares colombianos de 10 dígitos llevan el indicativo 57; si ya viene con indicativo se respeta. */
function enlaceWhatsApp(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, '')
  if (digitos.length === 10 && digitos.startsWith('3')) return `https://wa.me/57${digitos}`
  if (digitos.length >= 11) return `https://wa.me/${digitos}`
  return null
}

/** RF-03: el administrador lee los mensajes que llegan desde el formulario público de contacto. */
export default function BandejaContactoPage() {
  const [soloNoLeidos, setSoloNoLeidos] = useState(false)
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null)
  // Se traen todos para que los contadores no cambien al filtrar
  const { mensajes, cargando, error } = useMensajesContacto()
  const marcarLeido = useMarcarMensajeContactoLeido()
  const { push } = useToast()

  const total = mensajes.length
  const noLeidos = mensajes.filter((m) => !m.leido).length
  const autorizados = mensajes.filter((m) => m.autorizaTratamientoDatos).length
  const visibles = soloNoLeidos ? mensajes.filter((m) => !m.leido) : mensajes
  const seleccionado = mensajes.find((m) => m.id === seleccionadoId) ?? null
  const whatsapp = seleccionado?.telefono ? enlaceWhatsApp(seleccionado.telefono) : null

  const marcar = (id: number) =>
    marcarLeido.mutate(id, {
      onSuccess: () => push('Mensaje marcado como leído.'),
      onError: () => push('No se pudo marcar el mensaje como leído.', 'warn'),
    })

  return (
    <>
      <p className="kicker">PORTAL INSTITUCIONAL / BANDEJA DE CONTACTO</p>
      <h1 className="ptitle">Mensajes de contacto recibidos</h1>
      <p className="sub">Consultas de visitantes y familias enviadas desde el formulario de contacto público.</p>

      <div className="stats">
        <motion.div className="stat" whileHover={{ y: -3 }}>
          <span>Total de mensajes</span>
          <b>{total}</b>
          <small>Recibidos a través del formulario</small>
        </motion.div>
        <motion.div className="stat amber" whileHover={{ y: -3 }}>
          <span>Pendientes por leer</span>
          <b>{noLeidos}</b>
          <small>Marcados como no leídos</small>
        </motion.div>
        <motion.div className="stat green" whileHover={{ y: -3 }}>
          <span>Autorizan tratamiento de datos</span>
          <b>{total === 0 ? '—' : `${Math.round((autorizados / total) * 100)}%`}</b>
          <small>
            {autorizados} de {total} con autorización (Ley 1581)
          </small>
        </motion.div>
      </div>

      <div className="ftabs" role="group" aria-label="Filtrar mensajes">
        <button type="button" className={!soloNoLeidos ? 'on' : ''} aria-pressed={!soloNoLeidos} onClick={() => setSoloNoLeidos(false)}>
          Todos los mensajes ({total})
        </button>
        <button type="button" className={soloNoLeidos ? 'on' : ''} aria-pressed={soloNoLeidos} onClick={() => setSoloNoLeidos(true)}>
          Solo no leídos ({noLeidos})
        </button>
      </div>

      <div className="two bandeja">
        <div>
          {cargando ? (
            <p className="card">Cargando mensajes de contacto…</p>
          ) : error ? (
            <p className="card" role="alert">
              No se pudieron cargar los mensajes. Intenta de nuevo más tarde.
            </p>
          ) : visibles.length === 0 ? (
            <div className="card bandeja-vacia">
              <p className="muted-p">{soloNoLeidos ? 'No tienes mensajes pendientes por leer.' : 'Aún no se han recibido mensajes desde el formulario.'}</p>
            </div>
          ) : (
            <ul className="bandeja-lista">
              {visibles.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`card bandeja-item ${m.leido ? '' : 'nuevo'} ${seleccionadoId === m.id ? 'on' : ''}`}
                    aria-pressed={seleccionadoId === m.id}
                    onClick={() => setSeleccionadoId(m.id)}
                  >
                    <span className="bandeja-item-h">
                      <strong>{m.nombre}</strong>
                      <span className={`badge ${m.leido ? 'aprobada' : 'pendiente'}`}>{m.leido ? 'Leído' : 'No leído'}</span>
                    </span>
                    <span className="bandeja-asunto">{m.asunto}</span>
                    <span className="bandeja-extracto">{m.mensaje}</span>
                    <span className="bandeja-pie">
                      <span>✉ {m.correo}</span>
                      <span>{formatearFechaHora(m.fechaEnvio)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="card bandeja-detalle" aria-live="polite">
          {seleccionado ? (
            <>
              <div className="bandeja-detalle-h">
                <span className={`badge ${seleccionado.leido ? 'aprobada' : 'pendiente'}`}>
                  {seleccionado.leido ? 'Mensaje leído' : 'Pendiente por atender'}
                </span>
                {!seleccionado.leido && (
                  <button type="button" className="btn outline sm" disabled={marcarLeido.isPending} onClick={() => marcar(seleccionado.id)}>
                    Marcar como leído
                  </button>
                )}
              </div>
              <h3>{seleccionado.asunto}</h3>
              <dl className="bandeja-datos">
                <dt>Remitente</dt>
                <dd>{seleccionado.nombre}</dd>
                <dt>Correo</dt>
                <dd>
                  <a href={`mailto:${seleccionado.correo}`}>{seleccionado.correo}</a>
                </dd>
                {seleccionado.telefono && (
                  <>
                    <dt>Teléfono</dt>
                    <dd>
                      <a href={`tel:${seleccionado.telefono}`}>{seleccionado.telefono}</a>
                    </dd>
                  </>
                )}
                <dt>Fecha de envío</dt>
                <dd>{formatearFechaHora(seleccionado.fechaEnvio)}</dd>
              </dl>
              <p className="bandeja-cuerpo">{seleccionado.mensaje}</p>
              <div className="bandeja-acciones">
                <a href={`mailto:${seleccionado.correo}?subject=${encodeURIComponent(`Re: ${seleccionado.asunto}`)}`} className="btn sm">
                  Responder por correo ✉
                </a>
                {whatsapp && (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn outline sm">
                    Contactar por WhatsApp
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="bandeja-sin-seleccion">
              <span aria-hidden="true">📨</span>
              <p>Selecciona un mensaje del listado para ver su contenido completo y las opciones de respuesta.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
