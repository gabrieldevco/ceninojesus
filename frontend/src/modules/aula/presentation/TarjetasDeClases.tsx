import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { iconoDeGrupo, type Grupo } from '@/modules/grupos'

const COLORES = 6

/** Color estable por clase: la misma tarjeta conserva su color aunque cambie el orden. */
export function colorDeClase(grupo: Pick<Grupo, 'id'>): number {
  return grupo.id % COLORES
}

/** Tarjetas de clases al estilo de un aula virtual: cada grupo es una asignatura. */
export function TarjetasDeClases({
  grupos,
  onAbrir,
  pie,
  extra,
}: {
  grupos: Grupo[]
  onAbrir: (grupo: Grupo) => void
  /** Texto del pie de cada tarjeta (p. ej. tareas pendientes) */
  pie?: (grupo: Grupo) => ReactNode
  /** Tarjeta adicional al final (p. ej. "Crear clase") */
  extra?: ReactNode
}) {
  return (
    <div className="clases-grid">
      {grupos.map((g, i) => (
        <motion.button
          key={g.id}
          type="button"
          className={`clase-card c${colorDeClase(g)}`}
          onClick={() => onAbrir(g)}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.06, 0.4) }}
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          aria-label={`Abrir la clase ${g.nombre}`}
        >
          <span className="clase-card-top">
            <span className="clase-card-nombre">{g.nombre}</span>
            {g.horario && <span className="clase-card-horario">{g.horario}</span>}
            <span className="clase-card-ico" aria-hidden="true">
              {iconoDeGrupo(g.nombre, i)}
            </span>
          </span>
          <span className="clase-card-cuerpo">{g.descripcion || 'Material, tareas y calificaciones de la clase.'}</span>
          <span className="clase-card-pie">{pie ? pie(g) : 'Abrir clase'} →</span>
        </motion.button>
      ))}
      {extra}
    </div>
  )
}

/** Encabezado de color de una clase abierta, con regreso a las tarjetas. */
export function BannerDeClase({ grupo, indice, onVolver, children }: { grupo: Grupo; indice: number; onVolver: () => void; children?: ReactNode }) {
  return (
    <motion.div className={`clase-banner c${colorDeClase(grupo)}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <button type="button" className="clase-volver" onClick={onVolver}>
        ← Mis clases
      </button>
      <div className="clase-banner-cuerpo">
        <span className="clase-banner-ico" aria-hidden="true">
          {iconoDeGrupo(grupo.nombre, indice)}
        </span>
        <div>
          <h2>{grupo.nombre}</h2>
          {grupo.descripcion && <p>{grupo.descripcion}</p>}
          {grupo.horario && <small>Horario: {grupo.horario}</small>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}
