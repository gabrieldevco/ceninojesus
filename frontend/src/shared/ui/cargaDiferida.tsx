import { Component, lazy, type ComponentType, type ReactNode } from 'react'

const CLAVE_RECARGA = 'recarga-por-version-nueva'

/*
 * Como React.lazy, pero si el archivo de la página ya no existe (se publicó una versión nueva
 * mientras la pestaña estaba abierta), recarga la página una vez para traer la versión actual.
 */
export function cargaDiferida<T extends ComponentType<object>>(importar: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const modulo = await importar()
      sessionStorage.removeItem(CLAVE_RECARGA)
      return modulo
    } catch (error) {
      if (!sessionStorage.getItem(CLAVE_RECARGA)) {
        sessionStorage.setItem(CLAVE_RECARGA, '1')
        window.location.reload()
        return new Promise<never>(() => {})
      }
      throw error
    }
  })
}

/* Si una página falla al cargar, muestra un aviso con opción de recargar en lugar de dejar la pantalla en blanco */
export class LimiteDeError extends Component<{ children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  render() {
    if (!this.state.fallo) return this.props.children
    return (
      <div className="error-carga" role="alert">
        <h2>No pudimos cargar esta página</h2>
        <p>Puede que haya una versión nueva del sitio o que se haya perdido la conexión.</p>
        <button className="btn" onClick={() => window.location.reload()}>Recargar</button>
      </div>
    )
  }
}
