/**
 * Videos del aula: los de YouTube se incrustan (con youtube-nocookie.com, que no deja
 * cookies de seguimiento hasta que se reproduce) y los subidos se reproducen en la página.
 */

const ID_VALIDO = /^[A-Za-z0-9_-]{11}$/

/** Extrae el id de un enlace de YouTube (watch, youtu.be, shorts, embed, live); `null` si no lo es. */
export function idDeYoutube(url: string): string | null {
  let direccion: URL
  try {
    direccion = new URL(url.trim())
  } catch {
    return null
  }
  if (direccion.protocol !== 'https:' && direccion.protocol !== 'http:') return null
  const host = direccion.hostname.replace(/^(www\.|m\.|music\.)/, '')
  let id: string | null = null
  if (host === 'youtu.be') id = direccion.pathname.slice(1).split('/')[0] ?? null
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (direccion.pathname === '/watch') id = direccion.searchParams.get('v')
    else {
      const [, prefijo, valor] = direccion.pathname.split('/')
      if (prefijo && ['shorts', 'embed', 'live', 'v'].includes(prefijo)) id = valor ?? null
    }
  }
  return id && ID_VALIDO.test(id) ? id : null
}

export function urlIncrustadaDeYoutube(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`
}

const EXTENSIONES_VIDEO = ['.mp4', '.webm', '.mov']

export function esArchivoDeVideo(nombre: string): boolean {
  const n = nombre.toLowerCase()
  return EXTENSIONES_VIDEO.some((ext) => n.endsWith(ext))
}
