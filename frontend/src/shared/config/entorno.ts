/** Configuración leída del entorno de Vite (ver frontend/.env.example). */
export const entorno = {
  /** Con `true` la app usa datos y cuentas de demostración, sin backend. */
  modoDemo: import.meta.env.VITE_MODO_DEMO === 'true',
  /** Base de la API. Por defecto mismo origen: Vite (dev) y Caddy (prod) reenvían /api al backend. */
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '/api',
  /** Sitio sin backend: URL de la aplicación web de Apps Script que guarda los formularios en una hoja de cálculo. */
  formulariosUrl: (import.meta.env.VITE_FORMULARIOS_URL as string | undefined) ?? '',
} as const
