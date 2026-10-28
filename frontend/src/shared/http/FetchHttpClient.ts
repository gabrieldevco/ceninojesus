import { ErrorDeRed, NoAutorizado, errorDesdeRespuesta } from './errores'
import type { HttpClient, PeticionHttp, ProveedorDeToken } from './HttpClient'

type Fetch = typeof fetch

export class FetchHttpClient implements HttpClient {
  /** Una sola renovación a la vez: si varias peticiones reciben 401 juntas, comparten el mismo intento. */
  private renovacionEnCurso: Promise<string | null> | null = null

  constructor(
    private readonly baseUrl: string,
    private readonly proveedorDeToken?: ProveedorDeToken,
    private readonly fetchImpl: Fetch = (...args) => fetch(...args),
  ) {}

  async enviar<T = unknown>(peticion: PeticionHttp): Promise<T> {
    const autenticada = peticion.autenticada ?? true
    const token = autenticada ? this.proveedorDeToken?.tokenDeAcceso() ?? null : null
    const respuesta = await this.llamar(peticion, token)

    if (respuesta.status === 401 && autenticada && this.proveedorDeToken) {
      const nuevoToken = await this.renovar()
      if (!nuevoToken) throw new NoAutorizado()
      return this.interpretar<T>(await this.llamar(peticion, nuevoToken))
    }
    return this.interpretar<T>(respuesta)
  }

  private renovar(): Promise<string | null> {
    this.renovacionEnCurso ??= this.proveedorDeToken!.renovar().finally(() => {
      this.renovacionEnCurso = null
    })
    return this.renovacionEnCurso
  }

  private async llamar(peticion: PeticionHttp, token: string | null): Promise<Response> {
    const cabeceras: Record<string, string> = { Accept: 'application/json' }
    if (peticion.cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
    if (token) cabeceras.Authorization = `Bearer ${token}`
    try {
      return await this.fetchImpl(this.baseUrl.replace(/\/$/, '') + peticion.ruta, {
        method: peticion.metodo,
        headers: cabeceras,
        body: peticion.cuerpo === undefined ? undefined : JSON.stringify(peticion.cuerpo),
      })
    } catch (causa) {
      throw new ErrorDeRed(causa)
    }
  }

  private async interpretar<T>(respuesta: Response): Promise<T> {
    const texto = await respuesta.text()
    let cuerpo: unknown
    try {
      cuerpo = texto ? JSON.parse(texto) : undefined
    } catch {
      cuerpo = undefined
    }
    if (!respuesta.ok) throw respuesta.status === 401 ? new NoAutorizado() : errorDesdeRespuesta(respuesta.status, cuerpo)
    return cuerpo as T
  }
}
