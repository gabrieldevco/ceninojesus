import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type TonoAviso = 'ok' | 'info' | 'warn' | 'error'
interface Aviso {
  id: number
  msg: string
  tone: TonoAviso
}
interface ContextoAvisos {
  push: (msg: string, tone?: TonoAviso) => void
  toasts: Aviso[]
}

const Contexto = createContext<ContextoAvisos | null>(null)
let siguienteId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Aviso[]>([])
  const push = useCallback((msg: string, tone: TonoAviso = 'ok') => {
    const id = ++siguienteId
    setToasts((t) => [...t, { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])
  const valor = useMemo(() => ({ push, toasts }), [push, toasts])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useToast(): ContextoAvisos {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useToast requiere ToastProvider')
  return contexto
}

export function Toasts() {
  const { toasts } = useToast()
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast ${t.tone}`}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
