import { Link } from 'react-router-dom'
import { EncabezadoPagina } from '@/shared/ui/EncabezadoPagina'
import { Reveal } from '@/shared/ui/ui'
import { usePoliticaDeDatos } from './InstitucionalProvider'

type Bloque = { tipo: 'aviso'; texto: string } | { tipo: 'seccion'; numero: string; titulo: string; lineas: string[] } | { tipo: 'parrafo'; lineas: string[] }

/*
 * El texto de la política llega plano: bloques separados por línea en blanco.
 * "1. Título" abre una sección numerada, "[...]" es un aviso y "a) ..." son ítems de lista.
 */
function aBloques(texto: string): Bloque[] {
  return texto
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Bloque => {
      if (/^\[.*\]$/s.test(b)) return { tipo: 'aviso', texto: b.slice(1, -1) }
      const [primera, ...resto] = b.split('\n')
      const seccion = /^(\d+)\.\s+(.+)$/.exec(primera ?? '')
      if (seccion) return { tipo: 'seccion', numero: seccion[1] ?? '', titulo: seccion[2] ?? '', lineas: resto }
      return { tipo: 'parrafo', lineas: b.split('\n') }
    })
}

function Lineas({ lineas }: { lineas: string[] }) {
  const items = lineas.filter((l) => /^[a-z]\)\s/.test(l))
  const texto = lineas.filter((l) => !/^[a-z]\)\s/.test(l))
  return (
    <>
      {items.length > 0 && (
        <ul className="pol-lista">
          {items.map((l) => <li key={l}><b>{l.slice(0, 2)}</b>{l.slice(2)}</li>)}
        </ul>
      )}
      {texto.map((l) => <p key={l}>{l}</p>)}
    </>
  )
}

/** Ley 1581 de 2012: política de tratamiento de datos personales, enlazada desde los formularios con autorización. */
export default function PoliticaDatosPage() {
  const { politica, cargando, error } = usePoliticaDeDatos()
  const bloques = aBloques(politica?.texto ?? '')

  return (
    <>
      <EncabezadoPagina etiqueta="LEY 1581 DE 2012" titulo={<>Política de tratamiento de <em>datos personales</em></>}>
        Cómo el Centro Educativo El Niño Jesús recolecta, usa y protege los datos de familias, estudiantes y visitantes.
      </EncabezadoPagina>
      <div className="ad-wrap una ancha">
        <article className="ac-card politica">
          {cargando && <p className="muted-p">Cargando…</p>}
          {error && <p role="alert">No pudimos cargar la política en este momento. Intenta de nuevo más tarde.</p>}
          {politica && bloques.length === 0 && <p className="muted-p">La institución todavía no ha publicado su política.</p>}
          {bloques.map((b, i) => {
            if (b.tipo === 'aviso') return <div key={i} className="notice">⚠ {b.texto}</div>
            if (b.tipo === 'parrafo') return <div key={i} className="pol-intro"><Lineas lineas={b.lineas} /></div>
            return (
              <Reveal key={i} y={14}>
                <section className="pol-sec">
                  <span className="pol-num">{b.numero}</span>
                  <div>
                    <h2>{b.titulo}</h2>
                    <Lineas lineas={b.lineas} />
                  </div>
                </section>
              </Reveal>
            )
          })}
          {politica?.correo && (
            <p className="pol-correo">
              Para consultar, corregir o pedir la supresión de tus datos escribe a <a href={`mailto:${politica.correo}`}>{politica.correo}</a>.
            </p>
          )}
        </article>
        <div className="pol-cta">
          <div>
            <b>¿Quieres consultar, corregir o suprimir tus datos?</b>
            <span>Radica tu solicitud sin necesidad de una cuenta.</span>
          </div>
          <Link to="/solicitud-de-datos" className="btn coral">Radicar solicitud</Link>
          <Link to="/" className="btn outline">Volver al inicio</Link>
        </div>
      </div>
    </>
  )
}
