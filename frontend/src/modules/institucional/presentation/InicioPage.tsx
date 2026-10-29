import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CifraAnimada, GarabatosPortada, Inclinable, Paralaje, TituloAnimado } from '@/shared/ui/animaciones'
import { Reveal, Ico } from '@/shared/ui/ui'
import Carousel from '@/shared/ui/Carousel'
import { iconoDeGrupo, useGrupos } from '@/modules/grupos'
import { IMAGENES_POR_DEFECTO } from '../domain/contenidoPorDefecto'
import { deSeccion, direccionCompleta, enlaceDeLlamada, imagenUnica, pasosDelEnfoque } from '../domain/landing'
import FormularioContacto from './FormularioContacto'
import { useContenidoLanding } from './InstitucionalProvider'

const ICONS = {
  arte: <><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/></>,
  deporte: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>,
  musica: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
  lit: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
  ingles: <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></>,
  ciencia: <><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2M8.5 2h7M7 16h10"/></>,
}
const ICONO_GENERICO = <><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></>
const Icon = ({ k }: { k: string }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[k as keyof typeof ICONS] ?? ICONO_GENERICO}
  </svg>
)

export default function Inicio() {
  const { grupos } = useGrupos()
  const { contenido } = useContenidoLanding()
  const info = contenido.informacion
  const datos = deSeccion(contenido, 'dato_destacado').filter((e) => e.activo)
  const valores = deSeccion(contenido, 'valor').filter((e) => e.activo)
  const ofertas = deSeccion(contenido, 'oferta').filter((e) => e.activo)
  const directivos = deSeccion(contenido, 'directivo').filter((e) => e.activo)
  const galeria = deSeccion(contenido, 'galeria').filter((e) => e.activo && e.imagen)
  const pasos = pasosDelEnfoque(info)
  const portada = imagenUnica(contenido, 'imagen_portada', IMAGENES_POR_DEFECTO.imagen_portada)
  const quienes = imagenUnica(contenido, 'imagen_quienes', IMAGENES_POR_DEFECTO.imagen_quienes)
  const enfoque = imagenUnica(contenido, 'imagen_enfoque', IMAGENES_POR_DEFECTO.imagen_enfoque)
  const horizonte = [['Historia', info.historia], ['Misión', info.mision], ['Visión', info.vision]].filter(([, texto]) => texto)
  const llamada = enlaceDeLlamada(info.telefonos)

  return (
    <>
      <section className="hero" id="inicio">
        <div className="blob b1" /><div className="blob b2" />
        <GarabatosPortada />
        <motion.div className="hero-text" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7 }}>
          <p className="eyebrow">{info.portadaEtiqueta}</p>
          <h1>{info.portadaTitulo} <span className="grad">{info.portadaDestacado}</span></h1>
          <p className="lead">{info.portadaTexto}</p>
          <div className="hero-cta">
            <Link to="/admisiones" className="btn coral">Solicitar información</Link>
            <Link to="/acceso" className="btn ghost">Portal de acceso</Link>
          </div>
        </motion.div>
        <motion.div className="hero-card photo" initial={{ opacity: 0, scale: .92, rotate: 3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .8, delay: .15 }}>
          <img src={portada.src} alt={portada.alt} />
          <span className="float-chip c1">♞ Ajedrez</span><span className="float-chip c2">⚙ Robótica</span><span className="float-chip c3">♪ Música</span>
        </motion.div>
      </section>

      {datos.length > 0 && (
        <section className="band" aria-label="Datos destacados">
          {datos.map((d, i) => (
            <Reveal key={d.id} delay={i * .08} y={16}><div className={`band-item bd${(i % 4) + 1}`}><CifraAnimada valor={d.titulo} /><span>{d.texto}</span></div></Reveal>
          ))}
        </section>
      )}

      <section className="sec" id="institucional">
        <div className="split about">
          <Reveal className="frame"><div className="frame-bg" /><Paralaje intensidad={8}><img src={quienes.src} alt={quienes.alt} loading="lazy" decoding="async" /></Paralaje></Reveal>
          <Reveal delay={.1}>
            <p className="eyebrow coral">NUESTRA IDENTIDAD</p><TituloAnimado texto="¿Quiénes somos?" />
            <p className="big">{info.quienesPrincipal}</p>
            <p className="muted-p">{info.quienesSecundario}</p>
          </Reveal>
        </div>
      </section>

      <section className="sec tint-coral" id="constructivismo">
        <Reveal><p className="eyebrow coral">ENFOQUE CONSTRUCTIVISTA</p><TituloAnimado texto={info.enfoqueTitulo} /></Reveal>
        <div className="split">
          <Reveal className="phbox"><Paralaje intensidad={8}><img src={enfoque.src} alt={enfoque.alt} loading="lazy" decoding="async" /></Paralaje></Reveal>
          <Reveal delay={.12}>
            <p>{info.enfoqueTexto}</p>
            {pasos.length > 0 && (
              <p className="steps">
                {pasos.map((paso, i) => <span key={paso}>{i > 0 && ' → '}<b>{paso}</b></span>)}
              </p>
            )}
            <p className="muted-p">{info.enfoqueNota}</p>
          </Reveal>
        </div>
      </section>

      {horizonte.length > 0 && (
        <section className="sec alt tint-blue" id="horizonte">
          <Reveal><TituloAnimado texto="Nuestro horizonte institucional" />
          {info.horizontePendienteValidacion && (
            <div className="notice">⚠ <b>Textos propuestos · Pendientes de validación.</b> La historia, la misión y la visión oficiales no han sido suministradas.</div>
          )}</Reveal>
          <div className="grid3">
            {horizonte.map(([t, p], i) => (
              <Reveal key={t} delay={i * .1}><Inclinable className="card hover" grados={6}><h3>{t}</h3><p>{p}</p></Inclinable></Reveal>
            ))}
          </div>
        </section>
      )}

      {valores.length > 0 && (
        <section className="sec tint-warm" id="valores">
          <Reveal><TituloAnimado texto="Valores que se viven cada día" /></Reveal>
          <div className="grid4">
            {valores.map((v, i) => (
              <Reveal key={v.id} delay={i * .08}><Inclinable className={`value v${(i % 4) + 1}`}><span className="value-ico">{v.icono}</span><h3>{v.titulo}</h3><p>{v.texto}</p></Inclinable></Reveal>
            ))}
          </div>
        </section>
      )}

      {ofertas.length > 0 && (
        <section className="sec alt" id="academico">
          <Reveal><p className="eyebrow coral">ACADÉMICO</p><TituloAnimado texto="Lo que ofrecemos" />
          <p className="muted-p">Formación integral con énfasis en inglés, ciencia, arte y deporte.</p></Reveal>
          <div className="grid3">
            {ofertas.map((o, i) => (
              <Reveal key={o.id} delay={i * .07}><Inclinable className={`offer o${(i % 6) + 1}`}>
                <span className="offer-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="offer-ico"><Icon k={o.icono} /></span>
                <h3>{o.titulo}</h3><p>{o.texto}</p>
                <span className="offer-bar" />
              </Inclinable></Reveal>
            ))}
          </div>
        </section>
      )}

      {galeria.length > 0 && (
        <section className="sec gallery" id="galeria">
          <Reveal><p className="eyebrow light">VIDA ESCOLAR</p><TituloAnimado texto="Así se vive en El Niño Jesús" /></Reveal>
          <Reveal delay={.1}><Carousel slides={galeria.map((g) => ({ id: g.id, src: g.imagen, alt: g.texto || g.titulo, caption: g.titulo }))} /></Reveal>
        </section>
      )}

      {directivos.length > 0 && (
        <section className="sec" id="equipo">
          <Reveal><p className="eyebrow coral">EQUIPO</p><TituloAnimado texto="Cuerpo directivo" /></Reveal>
          <div className="grid3 team">
            {directivos.map((d, i) => (
              <Reveal key={d.id} delay={i * .1}><Inclinable className="card hover person" grados={6}>
                <div className="avatar">{iniciales(d.titulo)}</div><h3>{d.titulo}</h3><p className="role">{d.texto}</p>
                {d.detalle && <a href={`mailto:${d.detalle}`}>{d.detalle}</a>}
              </Inclinable></Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="sec alt" id="servicios">
        <Reveal><p className="eyebrow coral">SERVICIOS Y GRUPOS</p><TituloAnimado texto="Grupos extracurriculares" />
        <p className="muted-p">Las familias solicitan la matrícula desde el portal y el administrador de cada grupo aprueba el acceso.</p></Reveal>
        <div className="grid4">
          {grupos.map((g, i) => (
            <Reveal key={g.id} delay={i * .08}>
              <Inclinable className="tilt-link"><Link to="/familias/matricula" className={`card hover group-card g${(i % 4) + 1}`}>
                <span className="gicon">{iconoDeGrupo(g.nombre, i)}</span><h3>{g.nombre}</h3><p>Solicitar matrícula →</p>
              </Link></Inclinable>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="cta-sec" id="contacto">
        <Reveal>
          <div className="cta">
            <div className="cta-text">
              <p className="eyebrow light">CONTACTO</p>
              <TituloAnimado texto={info.contactoTitulo} />
              <p>{info.contactoTexto}</p>
              <div className="cta-btns">
                <Link to="/admisiones" className="btn white">Ir a Admisiones</Link>
                {llamada && <a href={llamada} className="btn glass">Llamar ahora</a>}
              </div>
            </div>
            <ul className="cta-list">
              {direccionCompleta(info) && <li><span>{Ico.pin}</span><div><b>Dirección</b>{direccionCompleta(info)}</div></li>}
              {info.telefonos && <li><span>{Ico.phone}</span><div><b>Teléfonos</b>{info.telefonos}</div></li>}
              {info.correo && <li><span>{Ico.mail}</span><div><b>Correo</b>{info.correo}</div></li>}
              {info.horarioAtencion && <li><span>{Ico.phone}</span><div><b>Horario de atención</b>{info.horarioAtencion}</div></li>}
            </ul>
          </div>
        </Reveal>
        {/* El formulario se monta sobre la tarjeta de contacto: un solo bloque, sin hueco entre ambos */}
        <Reveal className="cta-form" delay={.1}>
          <div id="escribenos">
            <FormularioContacto />
          </div>
        </Reveal>
      </section>
    </>
  )
}

/** "Miryam Junco Martínez" -> "MJ": las dos primeras iniciales. */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? '')
    .join('')
}
