import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AlmacenamientoLocal, type Almacenamiento } from '@/shared/lib/almacenamiento'
import { ToastProvider } from '@/shared/ui/toast'
import { AuthProvider, crearCasosDeUsoAuth } from '@/modules/auth'
import { AulaProvider, crearCasosDeUsoAula } from '@/modules/aula'
import { crearCasosDeUsoGrupos, GruposProvider } from '@/modules/grupos'
import { crearCasosDeUsoMatriculas, MatriculasProvider } from '@/modules/matriculas'

/**
 * Composición de dependencias (composition root): único lugar donde se eligen las
 * implementaciones concretas de cada puerto. Para conectar la API se cambian aquí.
 */
function crearCasosDeUso(almacenamiento: Almacenamiento) {
  return {
    auth: crearCasosDeUsoAuth(almacenamiento),
    grupos: crearCasosDeUsoGrupos(),
    matriculas: crearCasosDeUsoMatriculas(almacenamiento),
    aula: crearCasosDeUsoAula(),
  }
}

export function Proveedores({ almacenamiento, children }: { almacenamiento?: Almacenamiento; children: ReactNode }) {
  const [casosDeUso] = useState(() => crearCasosDeUso(almacenamiento ?? new AlmacenamientoLocal()))
  const [cliente] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }),
  )
  return (
    <QueryClientProvider client={cliente}>
      <ToastProvider>
        <AuthProvider casosDeUso={casosDeUso.auth}>
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
