import { Link } from 'react-router-dom'
import { usePoliticaDeDatos } from './InstitucionalProvider'

/** Ley 1581 de 2012: política de tratamiento de datos personales, enlazada desde los formularios con autorización. */
export default function PoliticaDatosPage() {
  const { politica, cargando, error } = usePoliticaDeDatos()
  const parrafos = (politica?.texto ?? '').split(/\n{2,}/).filter((p) => p.trim())

  return (
    <div className="sec" style={{ maxWidth: 820, margin: '0 auto' }}>
      <p className="eyebrow">LEY 1581 DE 2012</p>
      <h1>Política de tratamiento de datos personales</h1>
      {cargando && <p className="muted-p">Cargando…</p>}
      {error && <p role="alert">No pudimos cargar la política en este momento. Intenta de nuevo más tarde.</p>}
      {politica && parrafos.length === 0 && <p className="muted-p">La institución todavía no ha publicado su política.</p>}
      {parrafos.map((p, i) => (
        <p key={i} style={{ whiteSpace: 'pre-line' }}>
          {p}
        </p>
      ))}
      {politica?.correo && (
        <p>
          Para consultar, corregir o pedir la supresión de tus datos escribe a <a href={`mailto:${politica.correo}`}>{politica.correo}</a>.
        </p>
      )}
      <Link to="/" className="btn outline">
        Volver al inicio
      </Link>
    </div>
  )
}
