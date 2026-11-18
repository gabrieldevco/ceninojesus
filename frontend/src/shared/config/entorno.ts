/** Configuración leída del entorno de Vite (ver frontend/.env.example). */
export const entorno = {
  /** Con `true` la app usa datos y cuentas de demostración, sin backend. */
  modoDemo: import.meta.env.VITE_MODO_DEMO === 'true',
  /**
   * Portal (inicio de sesión, matrícula, aula, panel). Sin backend sería un portal de demostración con cuentas de
   * ejemplo, así que en el sitio público se oculta; para mostrarlo igualmente (p. ej. en una demo) usar VITE_PORTAL_DEMO=true.
   */
  portalVisible: import.meta.env.VITE_MODO_DEMO !== 'true' || import.meta.env.VITE_PORTAL_DEMO === 'true',
  /** Base de la API. Por defecto mismo origen: Vite (dev) y Caddy (prod) reenvían /api al backend. */
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '/api',
  /** Sitio sin backend: URL de la aplicación web de Apps Script que guarda los formularios en una hoja de cálculo. */
  formulariosUrl: (import.meta.env.VITE_FORMULARIOS_URL as string | undefined) ?? '',
} as const
