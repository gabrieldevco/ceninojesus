import {
  accionDeContenido,
  esEnlaceSeguro,
  PublicacionInvalida,
  validarArchivo,
  validarNuevaActividad,
  validarNuevoMaterial,
  type Material,
  type NuevaActividad,
  type NuevoMaterial,
} from './contenido'

const base: Material = {
  id: 1,
  grupoId: 3,
  titulo: 'Guía',
  descripcion: '',
  url: '',
  tieneArchivo: false,
  fechaPublicacion: '2026-10-01',
  publicado: true,
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

const archivo = (nombre: string, tamano = 1024) => new File([new Uint8Array(tamano)], nombre)

const nuevoMaterial: NuevoMaterial = {
  grupoId: 3,
  titulo: ' Guía ',
  descripcion: ' Léela ',
  tipo: 'documento',
  url: '',
  archivo: archivo('guia.pdf'),
  publicado: true,
}

function camposDe(accion: () => unknown) {
  try {
    accion()
  } catch (error) {
    if (error instanceof PublicacionInvalida) return error.campos
    throw error
  }
  throw new Error('se esperaba PublicacionInvalida')
}

describe('validarArchivo', () => {
  it('acepta los tipos permitidos sin importar mayúsculas', () => {
    expect(validarArchivo({ name: 'GUIA.PDF', size: 10 })).toBeNull()
  })

  it('rechaza tipos no permitidos y archivos sin extensión', () => {
    expect(validarArchivo({ name: 'virus.exe', size: 10 })).toMatch(/no permitido/i)
    expect(validarArchivo({ name: 'pagina.html', size: 10 })).toMatch(/no permitido/i)
    expect(validarArchivo({ name: 'sinextension', size: 10 })).toMatch(/no permitido/i)
  })

  it('rechaza archivos de más de 20 MB', () => {
    expect(validarArchivo({ name: 'grande.pdf', size: 21 * 1024 * 1024 })).toMatch(/máximo/i)
  })
})

describe('validarNuevoMaterial', () => {
  it('limpia los espacios y devuelve el material', () => {
    expect(validarNuevoMaterial(nuevoMaterial)).toMatchObject({ titulo: 'Guía', descripcion: 'Léela' })
  })

  it('exige título', () => {
    expect(camposDe(() => validarNuevoMaterial({ ...nuevoMaterial, titulo: '  ' })).titulo).toBeDefined()
  })

  it('exige un archivo o un enlace', () => {
    expect(camposDe(() => validarNuevoMaterial({ ...nuevoMaterial, archivo: null })).recurso).toMatch(/archivo o un enlace/i)
    expect(() => validarNuevoMaterial({ ...nuevoMaterial, archivo: null, url: 'https://ejemplo.com' })).not.toThrow()
  })

  it('un material de tipo enlace necesita URL', () => {
    expect(camposDe(() => validarNuevoMaterial({ ...nuevoMaterial, tipo: 'enlace' })).url).toBeDefined()
  })

  it('rechaza enlaces que no son http(s) y archivos inválidos', () => {
    expect(camposDe(() => validarNuevoMaterial({ ...nuevoMaterial, url: 'javascript:alert(1)' })).url).toMatch(/http/)
    expect(camposDe(() => validarNuevoMaterial({ ...nuevoMaterial, archivo: archivo('virus.exe') })).archivo).toBeDefined()
  })
})

describe('validarNuevaActividad', () => {
  const nueva: NuevaActividad = {
    grupoId: 3,
    titulo: 'Arma tu robot',
    descripcion: '',
    url: '',
    archivo: null,
    fechaEntrega: null,
    publicado: true,
  }

  it('el archivo y el enlace son opcionales', () => {
    expect(() => validarNuevaActividad(nueva)).not.toThrow()
  })

  it('exige título', () => {
    expect(camposDe(() => validarNuevaActividad({ ...nueva, titulo: '' })).titulo).toBeDefined()
  })
})
