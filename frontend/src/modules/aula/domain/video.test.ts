import { describe, expect, it } from 'vitest'
import { esArchivoDeVideo, idDeYoutube, urlIncrustadaDeYoutube } from './video'

describe('idDeYoutube', () => {
  it('reconoce los formatos comunes de enlace', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=OCSbzArwB10',
      'https://youtube.com/watch?v=OCSbzArwB10&t=42s',
      'https://m.youtube.com/watch?v=OCSbzArwB10',
      'https://youtu.be/OCSbzArwB10?si=abc',
      'https://www.youtube.com/shorts/OCSbzArwB10',
      'https://www.youtube.com/embed/OCSbzArwB10',
      'https://www.youtube.com/live/OCSbzArwB10',
    ]) {
      expect(idDeYoutube(url)).toBe('OCSbzArwB10')
    }
  })

  it('ignora lo que no es un video de YouTube válido', () => {
    for (const url of ['https://vimeo.com/123', 'https://youtube.com/channel/abc', 'https://youtu.be/corto', 'javascript:alert(1)', 'no es url']) {
      expect(idDeYoutube(url)).toBeNull()
    }
  })

  it('incrusta con youtube-nocookie', () => {
    expect(urlIncrustadaDeYoutube('OCSbzArwB10')).toBe('https://www.youtube-nocookie.com/embed/OCSbzArwB10?rel=0')
  })
})

describe('esArchivoDeVideo', () => {
  it('detecta videos por extensión', () => {
    expect(esArchivoDeVideo('Clase 1.MP4')).toBe(true)
    expect(esArchivoDeVideo('guia.pdf')).toBe(false)
  })
})
