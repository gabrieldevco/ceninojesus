import type { Almacenamiento } from '@/shared/lib/almacenamiento'
import type { HttpClient, ProveedorDeToken } from '@/shared/http/HttpClient'

const CLAVE_REFRESH = 'nj_refresh'

interface ParDeTokens {
  access: string
  refresh: string
}

/**
 * Guarda los tokens JWT y sabe renovarlos.
 * - El token de acceso (15 min) vive solo en memoria.
 * - El de refresco se guarda en el almacenamiento para sobrevivir a una recarga. El backend lo rota en cada
 *   renovación y lo revoca al cerrar sesión, lo que limita el daño si se filtra.
 */
export class GestorDeSesion implements ProveedorDeToken {
  private acceso: string | null = null

  constructor(
    private readonly almacenamiento: Almacenamiento,
    private readonly http: HttpClient,
  ) {}

  tokenDeAcceso(): string | null {
    return this.acceso
  }

  refresco(): string | null {
    return this.almacenamiento.leer<string>(CLAVE_REFRESH)
  }

  guardar(tokens: ParDeTokens): void {
    this.acceso = tokens.access
    this.almacenamiento.guardar(CLAVE_REFRESH, tokens.refresh)
  }

  limpiar(): void {
    this.acceso = null
    this.almacenamiento.borrar(CLAVE_REFRESH)
  }

  async renovar(): Promise<string | null> {
    const refresh = this.refresco()
    if (!refresh) return null
    try {
      const tokens = await this.http.enviar<ParDeTokens>({
        metodo: 'POST',
        ruta: '/auth/token/refresh/',
        cuerpo: { refresh },
        autenticada: false,
      })
      this.guardar(tokens)
      return tokens.access
    } catch {
      this.limpiar()
      return null
    }
  }
}
