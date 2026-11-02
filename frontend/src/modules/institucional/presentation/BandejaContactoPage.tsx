import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatearFecha } from '@/shared/lib/fecha'
import { useToast } from '@/shared/ui/toast'
import type { MensajeContactoRecibido } from '../domain/contacto'
import { useMarcarMensajeContactoLeido, useMensajesContacto } from './InstitucionalProvider'

export default function BandejaContactoPage() {
  const [soloNoLeidos, setSoloNoLeidos] = useState(false)
  const [seleccionado, setSeleccionado] = useState<MensajeContactoRecibido | null>(null)
  const { mensajes, cargando, error } = useMensajesContacto(soloNoLeidos)
  const marcarLeido = useMarcarMensajeContactoLeido()
  const { push } = useToast()

  const total = mensajes.length
  const noLeidos = mensajes.filter((m) => !m.leido).length

  const handleMarcarLeido = (id: number) => {
    marcarLeido.mutate(id, {
      onSuccess: () => {
        push('Mensaje marcado como leído.', 'ok')
        if (seleccionado?.id === id) {
          setSeleccionado({ ...seleccionado, leido: true })
        }
      },
      onError: () => push('No se pudo marcar el mensaje como leído.', 'warn'),
    })
  }

  return (
    <>
      <p className="kicker">PORTAL INSTITUCIONAL / BANDEJA DE CONTACTO</p>
      <h1 className="ptitle">Mensajes de contacto recibidos</h1>
      <p className="sub">
        Consultas de visitantes y familias interesadas enviadas desde el formulario de contacto público (RF-03).
      </p>

      {/* Métricas rápidas */}
      <div className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '22px' }}>
        <motion.div className="stat" whileHover={{ y: -3 }}>
          <span>Total mensajes</span>
          <b>{total}</b>
          <small>Recibidos a través del formulario</small>
        </motion.div>
        <motion.div className="stat amber" whileHover={{ y: -3 }}>
          <span>Pendientes por responder</span>
          <b>{noLeidos}</b>
          <small>Marcados como no leídos</small>
        </motion.div>
        <motion.div className="stat green" whileHover={{ y: -3 }}>
          <span>Habeas Data (Ley 1581)</span>
          <b style={{ fontSize: '24px', marginTop: '16px' }}>100% Autorizados</b>
          <small>Consentimiento de tratamiento registrado</small>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="ftabs" style={{ marginBottom: '18px' }}>
        <button
          type="button"
          className={!soloNoLeidos ? 'on' : ''}
          onClick={() => setSoloNoLeidos(false)}
        >
          Todos los mensajes ({total})
        </button>
        <button
          type="button"
          className={soloNoLeidos ? 'on' : ''}
          onClick={() => setSoloNoLeidos(true)}
        >
          Solo no leídos ({noLeidos})
        </button>
      </div>

      {/* Contenido en dos columnas: Lista y Detalle */}
      <div className="two" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start', gap: '20px' }}>
        {/* Columna Izquierda: Listado */}
        <div>
          {cargando ? (
            <p className="card">Cargando mensajes de contacto…</p>
          ) : error ? (
            <p className="card" style={{ color: '#b42318' }}>No se pudieron cargar los mensajes. Intenta de nuevo más tarde.</p>
          ) : mensajes.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <p className="muted-p" style={{ margin: 0, fontSize: '15px' }}>
                {soloNoLeidos ? 'No tienes mensajes pendientes por leer.' : 'Aún no se han recibido mensajes desde el formulario.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {mensajes.map((m) => {
                const esActivo = seleccionado?.id === m.id
                return (
                  <article
                    key={m.id}
                    className="card hover"
                    style={{
                      margin: 0,
                      cursor: 'pointer',
                      borderLeft: m.leido ? '4px solid #dfe7f1' : '4px solid #f5a623',
                      background: esActivo ? '#eef5ff' : '#fff',
                      transition: 'all .2s ease',
                    }}
                    onClick={() => setSeleccionado(m)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '15px', color: '#003380' }}>{m.nombre}</strong>
                      <span className={`badge ${m.leido ? 'aprobada' : 'pendiente'}`}>
                        {m.leido ? 'Leído' : 'No leído'}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '14px', color: '#202d42' }}>
                      {m.asunto}
                    </p>

                    <p style={{ margin: 0, fontSize: '13px', color: '#627187', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {m.mensaje}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px', color: '#8a99ad' }}>
                      <span>✉ {m.correo}</span>
                      <span>{formatearFecha(m.fechaEnvio)}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Detalle del Mensaje */}
        <aside className="card" style={{ padding: '28px', position: 'sticky', top: '80px' }}>
          {seleccionado ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className={`badge ${seleccionado.leido ? 'aprobada' : 'pendiente'}`}>
                  {seleccionado.leido ? 'Mensaje leído' : 'Pendiente por atender'}
                </span>
                {!seleccionado.leido && (
                  <button
                    type="button"
                    className="btn outline"
                    style={{ minHeight: '34px', fontSize: '12.5px', padding: '0 12px' }}
                    disabled={marcarLeido.isPending}
                    onClick={() => handleMarcarLeido(seleccionado.id)}
                  >
                    Marcar como leído
                  </button>
                )}
              </div>

              <h3 style={{ fontSize: '18px', color: '#003380', margin: '0 0 12px' }}>
                {seleccionado.asunto}
              </h3>

              <div style={{ background: '#f8fbff', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', fontSize: '13px', display: 'grid', gap: '6px' }}>
                <div>
                  <strong style={{ color: '#004aad' }}>Remitente: </strong>
                  <span>{seleccionado.nombre}</span>
                </div>
                <div>
                  <strong style={{ color: '#004aad' }}>Correo: </strong>
                  <a href={`mailto:${seleccionado.correo}`} style={{ color: '#004aad', textDecoration: 'underline' }}>
                    {seleccionado.correo}
                  </a>
                </div>
                {seleccionado.telefono && (
                  <div>
                    <strong style={{ color: '#004aad' }}>Teléfono: </strong>
                    <a href={`tel:${seleccionado.telefono}`} style={{ color: '#004aad' }}>
                      {seleccionado.telefono}
                    </a>
                  </div>
                )}
                <div>
                  <strong style={{ color: '#004aad' }}>Fecha de envío: </strong>
                  <span>{formatearFecha(seleccionado.fechaEnvio)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#627187', marginBottom: '6px' }}>
                  Contenido del mensaje:
                </strong>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#202d42', whiteSpace: 'pre-wrap', margin: 0, background: '#fff', border: '1px solid #dfe7f1', padding: '14px', borderRadius: '10px' }}>
                  {seleccionado.mensaje}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a
                  href={`mailto:${seleccionado.correo}?subject=Re: ${encodeURIComponent(seleccionado.asunto)}`}
                  className="btn"
                  style={{ minHeight: '38px', fontSize: '13px' }}
                >
                  Responder por correo ✉
                </a>
                {seleccionado.telefono && (
                  <a
                    href={`https://wa.me/57${seleccionado.telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn outline"
                    style={{ minHeight: '38px', fontSize: '13px' }}
                  >
                    Contactar por WhatsApp
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 12px', color: '#627187' }}>
              <span style={{ fontSize: '38px', display: 'block', marginBottom: '10px' }}>📨</span>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Selecciona un mensaje del listado de la izquierda para ver su contenido completo y opciones de respuesta.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
