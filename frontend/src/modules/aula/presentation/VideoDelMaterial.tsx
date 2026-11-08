import { useEffect, useState } from 'react'
import { ErrorApi } from '@/shared/http/errores'
import { useToast } from '@/shared/ui/toast'
import type { Material } from '../domain/contenido'
import { idDeYoutube, urlIncrustadaDeYoutube } from '../domain/video'
import { useVideoDeMaterial } from './AulaProvider'

/**
 * Reproduce el video dentro del aula: si el enlace es de YouTube lo incrusta; si el docente
 * subió el archivo, lo trae con la sesión del usuario solo cuando el estudiante pide verlo.
 */
export function VideoDelMaterial({ material }: { material: Material }) {
  const idYoutube = material.url ? idDeYoutube(material.url) : null
  const { push } = useToast()
  const traer = useVideoDeMaterial()
  const [direccion, setDireccion] = useState<string | null>(null)

  // Libera la memoria del video al salir de la página
  useEffect(() => () => {
    if (direccion) URL.revokeObjectURL(direccion)
  }, [direccion])

  if (idYoutube) {
    return (
      <div className="video-marco">
        <iframe
          src={urlIncrustadaDeYoutube(idYoutube)}
          title={`Video: ${material.titulo}`}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  if (material.tipo !== 'video' || !material.tieneArchivo) return null

  if (direccion) {
    return (
      <div className="video-marco propio">
        <video src={direccion} controls autoPlay playsInline aria-label={`Video: ${material.titulo}`} />
      </div>
    )
  }

  return (
    <button
      type="button"
      className="video-portada"
      disabled={traer.isPending}
      onClick={() =>
        traer.mutate(
          { grupoId: material.grupoId, contenidoId: material.id },
          {
            onSuccess: setDireccion,
            onError: (error) => push(error instanceof ErrorApi ? error.detalle : 'No se pudo cargar el video. Intenta de nuevo.', 'warn'),
          },
        )
      }
    >
      <span className="video-play" aria-hidden="true">
        ▶
      </span>
      {traer.isPending ? 'Cargando video…' : 'Ver video aquí'}
    </button>
  )
}
