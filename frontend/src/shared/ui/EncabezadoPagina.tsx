import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/* Franja azul con título para las páginas internas (mismo estilo que Admisiones) */
export function EncabezadoPagina({ etiqueta, titulo, children }: { etiqueta: string; titulo: ReactNode; children?: ReactNode }) {
  return (
    <section className="ad-hero">
      <i className="ac-blob a" />
      <i className="ac-blob b" />
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="ac-pill">● {etiqueta}</span>
        <h1>{titulo}</h1>
        {children && <p>{children}</p>}
      </motion.div>
    </section>
  )
}
