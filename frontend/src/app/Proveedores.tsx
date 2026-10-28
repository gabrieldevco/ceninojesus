import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { entorno } from '@/shared/config/entorno'
import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { AlmacenamientoLocal, type Almacenamiento } from '@/shared/lib/almacenamiento'
import { ToastProvider } from '@/shared/ui/toast'
import { AuthProvider, crearCasosDeUsoAuth, crearGestorDeSesion } from '@/modules/auth'
import { AulaProvider, crearCasosDeUsoAula } from '@/modules/aula'
import { crearCasosDeUsoGrupos, GruposProvider } from '@/modules/grupos'
import { crearCasosDeUsoMatriculas, MatriculasProvider } from '@/modules/matriculas'

interface Opciones {
  almacenamiento: Almacenamiento
  modoDemo: boolean
  apiUrl: string
  /** Para pruebas: reemplaza a `fetch` */
  fetchImpl?: typeof fetch
}

/**
 * Composición de dependencias (composition root): único lugar donde se eligen las
 * implementaciones concretas de cada puerto.
 * Pendiente de conectar a la API (siguen en modo demostración): grupos, matrículas y aula.
 */
function crearCasosDeUso({ almacenamiento, modoDemo, apiUrl, fetchImpl }: Opciones) {
  // El gestor de sesión renueva el token con un cliente sin sesión; el cliente principal usa al gestor.
  const sinSesion = new FetchHttpClient(apiUrl, undefined, fetchImpl)
  const sesion = crearGestorDeSesion(almacenamiento, sinSesion)
  const http = new FetchHttpClient(apiUrl, sesion, fetchImpl)
  return {
    auth: crearCasosDeUsoAuth({ almacenamiento, http, sesion, modoDemo }),
    grupos: crearCasosDeUsoGrupos(),
    matriculas: crearCasosDeUsoMatriculas(almacenamiento),
    aula: crearCasosDeUsoAula(),
  }
}

export function Proveedores({
  almacenamiento,
  modoDemo = entorno.modoDemo,
  apiUrl = entorno.apiUrl,
  fetchImpl,
  children,
}: Partial<Opciones> & { children: ReactNode }) {
  const [casosDeUso] = useState(() =>
    crearCasosDeUso({ almacenamiento: almacenamiento ?? new AlmacenamientoLocal(), modoDemo, apiUrl, fetchImpl }),
  )
  const [cliente] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }),
  )
  return (
    <QueryClientProvider client={cliente}>
      <ToastProvider>
        <AuthProvider casosDeUso={casosDeUso.auth} modoDemo={modoDemo}>
          <GruposProvider casosDeUso={casosDeUso.grupos}>
            <MatriculasProvider casosDeUso={casosDeUso.matriculas}>
              <AulaProvider casosDeUso={casosDeUso.aula}>{children}</AulaProvider>
            </MatriculasProvider>
          </GruposProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
