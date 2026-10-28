/** Puerto de almacenamiento clave-valor (en el navegador: localStorage). */
export interface Almacenamiento {
  leer<T>(clave: string): T | null
  guardar<T>(clave: string, valor: T): void
  borrar(clave: string): void
}

/** localStorage puede faltar o fallar (modo privado, datos bloqueados): nunca debe romper la aplicación. */
export class AlmacenamientoLocal implements Almacenamiento {
  leer<T>(clave: string): T | null {
    try {
      const crudo = localStorage.getItem(clave)
      return crudo === null ? null : (JSON.parse(crudo) as T)
    } catch {
      return null
    }
  }

  guardar<T>(clave: string, valor: T): void {
    try {
      localStorage.setItem(clave, JSON.stringify(valor))
    } catch {
      /* sin almacenamiento disponible */
    }
  }

  borrar(clave: string): void {
    try {
      localStorage.removeItem(clave)
    } catch {
      /* sin almacenamiento disponible */
    }
  }
}

/** Implementación en memoria para pruebas. */
export class AlmacenamientoMemoria implements Almacenamiento {
  private datos = new Map<string, string>()

  leer<T>(clave: string): T | null {
    const crudo = this.datos.get(clave)
    return crudo === undefined ? null : (JSON.parse(crudo) as T)
  }

  guardar<T>(clave: string, valor: T): void {
    this.datos.set(clave, JSON.stringify(valor))
  }

  borrar(clave: string): void {
    this.datos.delete(clave)
  }
}
