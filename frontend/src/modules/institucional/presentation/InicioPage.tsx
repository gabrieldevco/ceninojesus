import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Reveal, Ico } from '@/shared/ui/ui'
import Carousel from '@/shared/ui/Carousel'
import { iconoDeGrupo, useGrupos } from '@/modules/grupos'
import FormularioContacto from './FormularioContacto'

const VALORES = [['Autonomía', 'Pensar y actuar con responsabilidad.', '🧭'], ['Liderazgo', 'Participar y aportar a la comunidad.', '🚀'], ['Pertenencia', 'Cuidar los vínculos y el entorno escolar.', '🤝'], ['Cuidado ambiental', 'Reconocer nuestra responsabilidad con la naturaleza.', '🌱']]
const HORIZONTE = [['Historia', 'Propuesta: nuestra historia se construye en los vínculos entre estudiantes, docentes y familias, y en las experiencias compartidas de aprendizaje.'], ['Misión', 'Propuesta: acompañar la formación integral de personas críticas y autónomas, que construyan conocimiento, vivan sus valores y contribuyan al cuidado del medio ambiente.'], ['Visión', 'Propuesta: una comunidad de aprendizaje que impulse el liderazgo, la investigación, el arte y la participación responsable de sus estudiantes.']]

const ICONS = {
  arte: <><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/></>,
  deporte: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/></>,
  musica: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
  lit: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
  ingles: <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></>,
  ciencia: <><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2M8.5 2h7M7 16h10"/></>,
}
const Icon = ({ k }: { k: keyof typeof ICONS }) => <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[k]}</svg>

const OFRECEMOS: ReadonlyArray<readonly [keyof typeof ICONS, string, string]> = [
  ['arte', 'Danza y arte', 'Reconocemos al individuo en su integralidad: la danza y el arte como escenario de expresión, conocimiento de sí mismo y aprendizaje.'],
  ['deporte', 'Deportes', 'Concientizamos sobre los beneficios de la práctica deportiva para formar personas integrales, útiles en la sociedad.'],
  ['musica', 'Música', 'Un espacio de instrucción musical con personal idóneo y a la vanguardia de la pedagogía, para desarrollar talentos.'],
  ['lit', 'Literatura', 'Conectamos a los estudiantes con la visión de mundo de la literatura, desarrollando su capacidad comprensiva y crítica.'],
  ['ingles', 'Énfasis en inglés', 'Herramientas didácticas y pedagógicas para desarrollar su competencia en el idioma universal.'],
  ['ciencia', 'Ciencia y tecnología', 'Los mantenemos al tanto de los últimos avances científicos y tecnológicos y su uso en el entorno escolar.'],
]
const BAND = [['Preescolar a Media', 'Cuatro niveles de formación'], ['A+', 'Categoría en Pruebas Saber'], ['6', 'Áreas de formación'], ['EN', 'Énfasis en inglés']]
const DIRECTIVOS = [
  ['MJ', 'Miryam Junco Martínez', 'Rectora', null],
  ['DL', 'Dina Luz Lauren', 'Coordinadora general', 'coordinacion@ceninojesus.edu.co'],
  ['EA', 'Erica Arévalo', 'Psicóloga', 'psicologia@ceninojesus.edu.co'],
]

export default function Inicio() {
  const { grupos } = useGrupos()
  return (
    <>
      <section className="hero" id="inicio">
        <div className="blob b1" /><div className="blob b2" />
        <motion.div className="hero-text" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7 }}>
          <p className="eyebrow">CENTRO EDUCATIVO · BARRANQUILLA</p>
          <h1>Una comunidad que <span className="grad">aprende y crece.</span></h1>
          <p className="lead">Formación integral, valores y compromiso con el entorno. Conoce lo que nos define como comunidad educativa.</p>
          <div className="hero-cta">
            <Link to="/admisiones" className="btn coral">Solicitar información</Link>
            <Link to="/acceso" className="btn ghost">Portal de acceso</Link>
          </div>
        </motion.div>
        <motion.div className="hero-card photo" initial={{ opacity: 0, scale: .92, rotate: 3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .8, delay: .15 }}>
          <img src="/img/hero-colegio.jpg" alt="Estudiantes del Centro Educativo El Niño Jesús en actividades escolares" />
          <span className="float-chip c1">♞ Ajedrez</span><span className="float-chip c2">⚙ Robótica</span><span className="float-chip c3">♪ Música</span>
        </motion.div>
      </section>


      <section className="band" aria-label="Datos destacados">
        {BAND.map(([big, small], i) => (
          <Reveal key={small} delay={i * .08} y={16}><div className={`band-item bd${i + 1}`}><b>{big}</b><span>{small}</span></div></Reveal>
        ))}
      </section>

      <section className="sec" id="institucional">
        <div className="split about">
          <Reveal className="frame"><div className="frame-bg" /><img src="/img/quienes-somos.jpg" alt="Estudiantes en actividades de danza, títeres y laboratorio" /></Reveal>
          <Reveal delay={.1}>
            <p className="eyebrow coral">NUESTRA IDENTIDAD</p><h2>¿Quiénes somos?</h2>
            <p className="big">Somos una Institución de educación preescolar, básica primaria, básica secundaria y media vocacional orientada a la excelente formación integral de personas competentes y críticas; con valores y comprometidas con el medio ambiente.</p>
            <p className="muted-p">Somos reconocidos por nuestra excelente formación académica, con profundización en el idioma inglés, encaminada a la formación de valores, el cuidado del medio ambiente, el amor por la ciencia, la investigación y el arte.</p>
          </Reveal>
        </div>
      </section>

      <section className="sec tint-coral" id="constructivismo">
        <Reveal><p className="eyebrow coral">ENFOQUE CONSTRUCTIVISTA</p><h2>Aprender haciendo, pensar con autonomía</h2></Reveal>
        <div className="split">
          <Reveal className="phbox"><img src="/img/foto-constructivismo.png" alt="Estudiantes pintando en un taller de arte" /></Reveal>
          <Reveal delay={.12}>
            <p>El estudiante construye sus propios conocimientos a través de la mediación docente. El constructivismo favorece la autonomía, el liderazgo y el sentido de pertenencia para ser gestores y promotores de cambio.</p>
            <p className="steps"><b>Explorar</b> → <b>Preguntar</b> → <b>Construir</b> → <b>Reflexionar</b></p>
            <p className="muted-p">Experiencias cercanas, diálogo, trabajo colaborativo y reflexión sobre lo aprendido.</p>
          </Reveal>
        </div>
      </section>

      <section className="sec alt tint-blue" id="horizonte">
        <Reveal><h2>Nuestro horizonte institucional</h2>
        <div className="notice">⚠ <b>Textos propuestos · Pendientes de validación.</b> La historia, la misión y la visión oficiales no han sido suministradas.</div></Reveal>
        <div className="grid3">
          {HORIZONTE.map(([t, p], i) => (
            <Reveal key={t} delay={i * .1}><motion.article className="card hover" whileHover={{ y: -6 }}><h3>{t}</h3><p>{p}</p></motion.article></Reveal>
          ))}
        </div>
      </section>

      <section className="sec tint-warm" id="valores">
        <Reveal><h2>Valores que se viven cada día</h2></Reveal>
        <div className="grid4">
          {VALORES.map(([t, p, e], i) => (
            <Reveal key={t} delay={i * .08}><motion.article className={`value v${i + 1}`} whileHover={{ y: -8, rotate: i % 2 ? .6 : -.6 }}><span className="value-ico">{e}</span><h3>{t}</h3><p>{p}</p></motion.article></Reveal>
          ))}
        </div>
      </section>

      <section className="sec alt" id="academico">
        <Reveal><p className="eyebrow coral">ACADÉMICO</p><h2>Lo que ofrecemos</h2>
        <p className="muted-p">Formación integral con énfasis en inglés, ciencia, arte y deporte.</p></Reveal>
        <div className="grid3">
          {OFRECEMOS.map(([k, t, p], i) => (
            <Reveal key={t} delay={i * .07}><motion.article className="offer" whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }}>
              <span className="offer-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="offer-ico"><Icon k={k} /></span>
              <h3>{t}</h3><p>{p}</p>
              <span className="offer-bar" />
            </motion.article></Reveal>
          ))}
        </div>
      </section>

      <section className="sec gallery" id="galeria">
        <Reveal><p className="eyebrow light">VIDA ESCOLAR</p><h2>Así se vive en El Niño Jesús</h2></Reveal>
        <Reveal delay={.1}><Carousel /></Reveal>
      </section>

      <section className="sec" id="equipo">
        <Reveal><p className="eyebrow coral">EQUIPO</p><h2>Cuerpo directivo</h2></Reveal>
        <div className="grid3 team">
          {DIRECTIVOS.map(([ini, n, r, mail], i) => (
            <Reveal key={n} delay={i * .1}><motion.article className="card hover person" whileHover={{ y: -6 }}>
              <div className="avatar">{ini}</div><h3>{n}</h3><p className="role">{r}</p>
              {mail ? <a href={`mailto:${mail}`}>{mail}</a> : <span className="muted-p">Representante legal</span>}
            </motion.article></Reveal>
          ))}
        </div>
      </section>

      <section className="sec alt" id="servicios">
        <Reveal><p className="eyebrow coral">SERVICIOS Y GRUPOS</p><h2>Grupos extracurriculares</h2>
        <p className="muted-p">Las familias solicitan la matrícula desde el portal y el administrador de cada grupo aprueba el acceso.</p></Reveal>
        <div className="grid4">
          {grupos.map((g, i) => (
            <Reveal key={g.id} delay={i * .08}>
              <Link to="/familias/matricula" className={`card hover group-card g${i + 1}`}>
                <span className="gicon">{iconoDeGrupo(g.nombre, i)}</span><h3>{g.nombre}</h3><p>Solicitar matrícula →</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="cta-sec" id="contacto">
        <Reveal>
          <div className="cta">
            <div className="cta-text">
              <p className="eyebrow light">CONTACTO</p>
              <h2>Conversemos en Barranquilla</h2>
              <p>Resolvemos tus dudas sobre admisiones, grupos extracurriculares y servicios del colegio.</p>
              <div className="cta-btns">
                <Link to="/admisiones" className="btn white">Ir a Admisiones</Link>
                <a href="tel:+573344105" className="btn glass">Llamar ahora</a>
              </div>
            </div>
            <ul className="cta-list">
              <li><span>{Ico.pin}</span><div><b>Dirección</b>Calle 38B # 4-35, Barranquilla - Colombia</div></li>
              <li><span>{Ico.phone}</span><div><b>Teléfonos</b>334 4105 · 315 8230285</div></li>
              <li><span>{Ico.mail}</span><div><b>Correo</b>ce_nino@hotmail.com</div></li>
            </ul>
          </div>
        </Reveal>
      </section>

      <section className="sec" id="escribenos">
        <Reveal>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <FormularioContacto />
          </div>
        </Reveal>
      </section>
    </>
  )
}
