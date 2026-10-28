import { accionDeContenido, esEnlaceSeguro, type Material } from './contenido'

const base: Material = {
  id: 1,
  grupoId: 3,
  titulo: 'Guía',
  descripcion: '',
  url: '',
  tieneArchivo: false,
  fechaPublicacion: '2026-10-01',
  tipo: 'documento',
}

describe('accionDeContenido', () => {
  it('descarga si hay archivo, aunque también tenga enlace', () => {
    expect(accionDeContenido({ ...base, tieneArchivo: true, url: 'https://ejemplo.com' })).toBe('descargar')
  })

  it('abre el enlace si solo hay URL', () => {
    expect(accionDeContenido({ ...base, url: 'https://ejemplo.com' })).toBe('abrir-enlace')
  })

  it('no ofrece nada si no hay archivo ni enlace', () => {
    expect(accionDeContenido(base)).toBe('ninguna')
  })
})

describe('esEnlaceSeguro', () => {
  it('acepta http y https', () => {
    expect(esEnlaceSeguro('https://ejemplo.com/a?b=1')).toBe(true)
    expect(esEnlaceSeguro('http://ejemplo.com')).toBe(true)
  })

  it('rechaza esquemas peligrosos y texto que no es URL', () => {
    expect(esEnlaceSeguro('javascript:alert(1)')).toBe(false)
    expect(esEnlaceSeguro('data:text/html;base64,AAAA')).toBe(false)
    expect(esEnlaceSeguro('no es una url')).toBe(false)
    expect(esEnlaceSeguro('')).toBe(false)
  })
})
