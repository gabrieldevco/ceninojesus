import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SLIDES: [string, string, string][] = [
  ['drums', 'Estudiantes con tambor en una muestra cultural', 'Cultura y expresión'],
  ['baile', 'Estudiantes en actividad de expresión corporal', 'Danza y movimiento'],
  ['voleibol', 'Estudiantes jugando voleibol', 'Deporte y trabajo en equipo'],
  ['proyecto', 'Estudiantes con su proyecto de redes sociales', 'Proyectos de aula'],
  ['laboratorio', 'Estudiantes en el laboratorio de ciencias', 'Ciencia y experimentación'],
]

export default function Carousel() {
  const [[i = 0, dir = 1], set] = useState<[number, number]>([0, 1]); const [pause, setPause] = useState(false)
  const go = useCallback((d: number) => set(([c = 0]) => [(c + d + SLIDES.length) % SLIDES.length, d]), [])
  useEffect(() => { if (pause) return; const t = setInterval(() => go(1), 5000); return () => clearInterval(t) }, [pause, go])
  const [file = '', alt = '', caption = ''] = SLIDES[i] ?? []
  return (
    <div className="carousel" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}
      tabIndex={0} onKeyDown={(e) => (e.key === 'ArrowRight' ? go(1) : e.key === 'ArrowLeft' ? go(-1) : undefined)} aria-roledescription="carrusel" aria-label="Vida escolar">
      <div className="car-stage">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.figure key={file} className="car-slide" custom={dir}
            initial={{ opacity: 0, x: dir * 80, scale: 1.04 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: dir * -80 }}
            transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={.2}
            onDragEnd={(_, { offset }) => Math.abs(offset.x) > 80 && go(offset.x < 0 ? 1 : -1)}>
            <img src={`/img/galeria-${file}.jpg`} alt={alt} draggable={false} />
            <figcaption>{caption}</figcaption>
          </motion.figure>
        </AnimatePresence>
        <button className="car-btn prev" onClick={() => go(-1)} aria-label="Foto anterior">‹</button>
        <button className="car-btn next" onClick={() => go(1)} aria-label="Foto siguiente">›</button>
      </div>
      <div className="car-dots">
        {SLIDES.map(([f], n) => <button key={f} className={n === i ? 'on' : ''} aria-label={`Foto ${n + 1}`} onClick={() => set([n, n > i ? 1 : -1])} />)}
      </div>
      {!pause && <motion.span key={i} className="car-bar" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 5, ease: 'linear' }} />}
    </div>
  )
}
