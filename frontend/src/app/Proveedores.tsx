import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { entorno } from '@/shared/config/entorno'
import { FetchHttpClient } from '@/shared/http/FetchHttpClient'
import { AlmacenamientoLocal, type Almacenamiento } from '@/shared/lib/almacenamiento'
import { ToastProvider } from '@/shared/ui/toast'
import { AuthProvider, crearCasosDeUsoAuth, crearGestorDeSesion } from '@/modules/auth'
import { AulaProvider, crearCasosDeUsoAula } from '@/modules/aula'
import { crearCasosDeUsoEstudiantes, EstudiantesProvider } from '@/modules/estudiantes'
import { crearCasosDeUsoGrupos, GruposProvider } from '@/modules/grupos'
import { crearCasosDeUsoInteresados, InteresadosProvider } from '@/modules/interesados'
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
 * Todos los módulos usan la API; con VITE_MODO_DEMO=true cada uno usa su repositorio de demostración.
 */
function crearCasosDeUso({ almacenamiento, modoDemo, apiUrl, fetchImpl }: Opciones) {
  // El gestor de sesión renueva el token con un cliente sin sesión; el cliente principal usa al gestor.
  const sinSesion = new FetchHttpClient(apiUrl, undefined, fetchImpl)
  const sesion = crearGestorDeSesion(almacenamiento, sinSesion)
  const http = new FetchHttpClient(apiUrl, sesion, fetchImpl)
  return {
    auth: crearCasosDeUsoAuth({ almacenamiento, http, sesion, modoDemo }),
    estudiantes: crearCasosDeUsoEstudiantes({ http, almacenamiento, modoDemo }),
    grupos: crearCasosDeUsoGrupos({ http, modoDemo }),
    interesados: crearCasosDeUsoInteresados({ http, modoDemo }),
    matriculas: crearCasosDeUsoMatriculas({ http, almacenamiento, modoDemo }),
    aula: crearCasosDeUsoAula({ http, modoDemo }),
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
            <EstudiantesProvider casosDeUso={casosDeUso.estudiantes}>
              <MatriculasProvider casosDeUso={casosDeUso.matriculas}>
                <InteresadosProvider casosDeUso={casosDeUso.interesados}>
                  <AulaProvider casosDeUso={casosDeUso.aula}>{children}</AulaProvider>
                </InteresadosProvider>
              </MatriculasProvider>
            </EstudiantesProvider>
          </GruposProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
