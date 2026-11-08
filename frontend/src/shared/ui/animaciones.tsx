import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/*
 * Título de sección que se "escribe" letra por letra al entrar en pantalla, y su trazo inferior se dibuja después.
 * Las letras las genera React (no SplitText) para que el texto, editable desde el panel, pueda cambiar sin romper el DOM.
 */
export function TituloAnimado({ texto, className }: { texto: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useGSAP(
    () => {
      const letras = ref.current?.querySelectorAll('.ch')
      if (!letras?.length) return
      gsap
        .timeline({ scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } })
        .from(letras, { yPercent: 115, rotate: 10, opacity: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.022 })
        .fromTo(ref.current, { '--trazo': 0 }, { '--trazo': 1, duration: 0.6, ease: 'power3.out' }, '-=0.25')
    },
    { scope: ref, dependencies: [texto] },
  )
  return (
    <h2 ref={ref} className={className} aria-label={texto}>
      {texto.split(' ').map((palabra, i) => (
        <Fragment key={`${palabra}-${i}`}>
          {i > 0 && ' '}
          <span className="word" aria-hidden="true">
            {[...palabra].map((letra, j) => <span key={j} className="ch">{letra}</span>)}
          </span>
        </Fragment>
      ))}
    </h2>
  )
}

/* Cifra que cuenta desde cero al aparecer; si el texto no es un número (p. ej. "A+"), aparece con un rebote */
export function CifraAnimada({ valor }: { valor: string }) {
  const ref = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const trigger = { trigger: el, start: 'top 92%', once: true }
      const numero = /^\d+$/.test(valor) ? Number(valor) : null
      if (numero === null) {
        gsap.from(el, { scale: 0.3, opacity: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)', scrollTrigger: trigger })
        return
      }
      const contador = { n: 0 }
      gsap.to(contador, {
        n: numero,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: trigger,
        onUpdate: () => { el.textContent = String(Math.round(contador.n)) },
      })
    },
    { dependencies: [valor] },
  )
  return <b ref={ref}>{valor}</b>
}

/* La imagen se desplaza más lento que la página (paralaje) */
export function Paralaje({ children, className, intensidad = 12 }: { children: ReactNode; className?: string; intensidad?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.fromTo(
        ref.current,
        { yPercent: -intensidad / 2 },
        { yPercent: intensidad / 2, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } },
      )
    },
    { scope: ref },
  )
  return <div ref={ref} className={className}>{children}</div>
}

/* Tarjeta que se inclina en 3D hacia el cursor, con un brillo que sigue al mouse */
export function Inclinable({
  children,
  className,
  style,
  grados = 10,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
  grados?: number
}) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const resorte = { stiffness: 220, damping: 18 }
  const rotateY = useSpring(useTransform(x, [0, 1], [-grados, grados]), resorte)
  const rotateX = useSpring(useTransform(y, [0, 1], [grados, -grados]), resorte)
  const brilloX = useTransform(x, (v) => `${v * 100}%`)
  const brilloY = useTransform(y, (v) => `${v * 100}%`)
  const brillo = useMotionTemplate`radial-gradient(circle at ${brilloX} ${brilloY}, rgba(255,255,255,.55), transparent 55%)`
  return (
    <motion.div
      className={`tilt ${className ?? ''}`}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900 }}
      whileHover={{ scale: 1.03, y: -6 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left) / r.width)
        y.set((e.clientY - r.top) / r.height)
      }}
      onPointerLeave={() => { x.set(0.5); y.set(0.5) }}
    >
      {children}
      <motion.span className="tilt-shine" style={{ background: brillo }} aria-hidden="true" />
    </motion.div>
  )
}

/* Garabatos de cuaderno que se dibujan, flotan y se mueven con el mouse en la portada */
const GARABATOS = [
  { d: 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z', color: '#f5a524', pos: { left: '4%', top: '12%' }, size: 46 },
  { d: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', color: '#f04a34', pos: { left: '44%', top: '8%' }, size: 40 },
  { d: 'M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M3 12c0-2 4-4 9-4s9 2 9 4-4 4-9 4-9-2-9-4zM7.5 4.2c1.7-1 5.5 1.6 8.5 6.8s3.2 9.8 1.5 10.8-5.5-1.6-8.5-6.8-3.2-9.8-1.5-10.8z', color: '#0b5fd6', pos: { left: '50%', bottom: '10%' }, size: 52 },
  { d: 'M2 18L18 2l4 4L6 22H2zM14 6l4 4', color: '#1e9c63', pos: { left: '2%', bottom: '14%' }, size: 40 },
  { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18M3 12h18', color: '#7b4fd6', pos: { right: '3%', top: '6%' }, size: 42 },
  { d: 'M4 14c2-4 4-4 6 0s4 4 6 0 4-4 6 0', color: '#0e9fb0', pos: { right: '6%', bottom: '6%' }, size: 48 },
]

export function GarabatosPortada() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 })
  useGSAP(
    () => {
      const trazos = gsap.utils.toArray<SVGPathElement>('.doodle path')
      trazos.forEach((p) => {
        const largo = typeof p.getTotalLength === 'function' ? p.getTotalLength() : 100
        gsap.set(p, { strokeDasharray: largo, strokeDashoffset: largo })
      })
      gsap.to(trazos, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.18, delay: 0.5 })
      gsap.utils.toArray<HTMLElement>('.doodle').forEach((el, i) => {
        gsap.to(el, {
          y: gsap.utils.random(-16, 16),
          x: gsap.utils.random(-10, 10),
          rotate: gsap.utils.random(-14, 14),
          duration: gsap.utils.random(3, 5),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.2,
        })
      })
    },
    { scope: ref },
  )
  // Con el mouse, los garabatos se desplazan en sentido contrario: efecto de profundidad
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mx.set((e.clientX / window.innerWidth - 0.5) * -30)
      my.set((e.clientY / window.innerHeight - 0.5) * -20)
    }
    window.addEventListener('pointermove', mover)
    return () => window.removeEventListener('pointermove', mover)
  }, [mx, my])
  return (
    <motion.div ref={ref} className="doodles" aria-hidden="true" style={{ x: mx, y: my }}>
      {GARABATOS.map((g, i) => (
        <span key={i} className="doodle" style={{ ...g.pos, width: g.size, height: g.size }}>
          <svg viewBox="0 0 24 24" width={g.size} height={g.size} fill="none" stroke={g.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={g.d} />
          </svg>
        </span>
      ))}
    </motion.div>
  )
}

