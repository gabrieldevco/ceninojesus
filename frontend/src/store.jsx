import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react'
import { USERS, DEMO_PASSWORD, seedRequests } from './data/demo'

const safe = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sin almacenamiento */ } },
  del(k) { try { localStorage.removeItem(k) } catch { /* noop */ } },
}

/* ---------- Autenticación de demostración ---------- */
const AuthCtx = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { const e = safe.get('nj_user'); return e && USERS[e] ? { email: e, ...USERS[e] } : null })
  const login = (email, password) => {
    const key = email.trim().toLowerCase()
    if (USERS[key] && password === DEMO_PASSWORD) {
      safe.set('nj_user', key); const u = { email: key, ...USERS[key] }; setUser(u); return u
    }
    return null
  }
  const logout = () => { safe.del('nj_user'); setUser(null) }
  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)

/* ---------- Solicitudes de matrícula (compartidas entre roles) ---------- */
const ReqCtx = createContext(null)
function reducer(state, a) {
  switch (a.type) {
    case 'add': return [{ id: Date.now(), status: 'pendiente', date: new Date().toISOString().slice(0, 10), ...a.req }, ...state]
    case 'resolve': return state.map(r => r.id === a.id ? { ...r, status: a.status, reason: a.reason } : r)
    case 'reset': return seedRequests
    default: return state
  }
}
export function RequestsProvider({ children }) {
  const [requests, dispatch] = useReducer(reducer, null, () => safe.get('nj_requests_v2') || seedRequests)
  useEffect(() => { safe.set('nj_requests_v2', requests) }, [requests])
  return <ReqCtx.Provider value={{ requests, dispatch }}>{children}</ReqCtx.Provider>
}
export const useRequests = () => useContext(ReqCtx)

/* ---------- Avisos (toasts) ---------- */
const ToastCtx = createContext(null)
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, tone = 'ok') => {
    const id = Math.random()
    setToasts(t => [...t, { id, msg, tone }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800)
  }, [])
  return <ToastCtx.Provider value={{ push, toasts }}>{children}</ToastCtx.Provider>
}
export const useToast = () => useContext(ToastCtx)
