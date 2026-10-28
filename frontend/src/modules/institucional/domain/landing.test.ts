import { CONTENIDO_POR_DEFECTO } from './contenidoPorDefecto'
import {
  deSeccion,
  direccionCompleta,
  ElementoInvalido,
  enlaceDeLlamada,
  ImagenInvalida,
  imagenUnica,
  pasosDelEnfoque,
  validarElemento,
  validarImagen,
  type ContenidoLanding,
  type ElementoLanding,
} from './landing'
import { EnlaceInvalido, esUrlWeb, validarDireccionesWeb, validarEnlace } from './sitio'

const elemento = (extra: Partial<ElementoLanding>): ElementoLanding => ({
  id: 1,
  seccion: 'valor',
  titulo: 'T',
  texto: '',
  detalle: '',
  icono: '',
  imagen: '',
  tieneImagenSubida: false,
  orden: 0,
  activo: true,
  ...extra,
})

describe('deSeccion', () => {
  it('filtra por sección y respeta el orden definido (el id desempata)', () => {
    const contenido: ContenidoLanding = {
      informacion: CONTENIDO_POR_DEFECTO.informacion,
      elementos: [
        elemento({ id: 3, titulo: 'c', orden: 1 }),
        elemento({ id: 2, titulo: 'b', orden: 0 }),
        elemento({ id: 1, titulo: 'a', orden: 0 }),
        elemento({ id: 4, seccion: 'oferta', titulo: 'otra' }),
      ],
    }
    expect(deSeccion(contenido, 'valor').map((e) => e.titulo)).toEqual(['a', 'b', 'c'])
  })
})

describe('imagenUnica', () => {
  const porDefecto = { src: '/img/x.jpg', alt: 'x' }
  const con = (elementos: ElementoLanding[]): ContenidoLanding => ({ informacion: CONTENIDO_POR_DEFECTO.informacion, elementos })

  it('usa la imagen incluida mientras no se haya subido otra', () => {
    expect(imagenUnica(con([]), 'imagen_portada', porDefecto)).toEqual(porDefecto)
    expect(imagenUnica(con([elemento({ seccion: 'imagen_portada', imagen: '' })]), 'imagen_portada', porDefecto)).toEqual(porDefecto)
  })

  it('usa la imagen de la institución y su descripción', () => {
    const subida = elemento({ seccion: 'imagen_portada', imagen: '/api/x/', texto: 'Niños jugando' })
    expect(imagenUnica(con([subida]), 'imagen_portada', porDefecto)).toEqual({ src: '/api/x/', alt: 'Niños jugando' })
  })

  it('ignora la imagen oculta', () => {
    const oculta = elemento({ seccion: 'imagen_portada', imagen: '/api/x/', activo: false })
    expect(imagenUnica(con([oculta]), 'imagen_portada', porDefecto)).toEqual(porDefecto)
  })
})

describe('textos de la página', () => {
  it('separa los pasos del enfoque y descarta los vacíos', () => {
    expect(pasosDelEnfoque({ enfoquePasos: ' Explorar, , Preguntar ,Construir ' })).toEqual(['Explorar', 'Preguntar', 'Construir'])
    expect(pasosDelEnfoque({ enfoquePasos: '' })).toEqual([])
  })

  it('arma el enlace de llamada con el primer teléfono', () => {
    expect(enlaceDeLlamada('315 8230285 · 334 4105')).toBe('tel:+573158230285')
    expect(enlaceDeLlamada('334 4105')).toBe('tel:3344105')
    expect(enlaceDeLlamada('')).toBe('')
    expect(enlaceDeLlamada('ext 12')).toBe('')
  })

  it('une dirección y ciudad sin separadores sobrantes', () => {
    expect(direccionCompleta({ direccion: 'Calle 1', ciudad: 'Barranquilla' })).toBe('Calle 1, Barranquilla')
    expect(direccionCompleta({ direccion: '', ciudad: 'Barranquilla' })).toBe('Barranquilla')
    expect(direccionCompleta({ direccion: ' ', ciudad: '' })).toBe('')
  })
})

describe('validarElemento', () => {
  it('exige título y limpia espacios', () => {
    expect(validarElemento('valor', { titulo: ' Respeto ', texto: ' Convivir ' })).toEqual({ titulo: 'Respeto', texto: 'Convivir' })
    expect(() => validarElemento('valor', { titulo: ' ' })).toThrow(ElementoInvalido)
  })

  it('en la galería exige describir la imagen', () => {
    expect(() => validarElemento('galeria', { titulo: 'Foto', texto: ' ' })).toThrow(/describe la imagen/i)
    expect(validarElemento('galeria', { titulo: 'Foto', texto: 'Niños en clase' }).texto).toBe('Niños en clase')
  })

  it('un cambio parcial no exige los campos que no toca', () => {
    expect(validarElemento('galeria', { orden: 3 })).toEqual({ orden: 3 })
    expect(() => validarElemento('valor', { orden: -1 })).toThrow(ElementoInvalido)
  })
})

describe('validarImagen', () => {
  it('solo acepta JPG o PNG de hasta 5 MB', () => {
    expect(() => validarImagen({ type: 'image/png', size: 1024 })).not.toThrow()
    expect(() => validarImagen({ type: 'application/pdf', size: 1024 })).toThrow(ImagenInvalida)
    expect(() => validarImagen({ type: 'image/gif', size: 1024 })).toThrow(/JPG o PNG/)
    expect(() => validarImagen({ type: 'image/jpeg', size: 6 * 1024 * 1024 })).toThrow(/máximo de 5 MB/)
  })
})

describe('enlaces y direcciones web', () => {
  it('solo admite direcciones http o https', () => {
    expect(esUrlWeb('https://biblioteca.colegio.co/catalogo')).toBe(true)
    expect(esUrlWeb(' http://colegio.co ')).toBe(true)
    expect(esUrlWeb('javascript:alert(1)')).toBe(false)
    expect(esUrlWeb('biblioteca.colegio.co')).toBe(false)
    expect(esUrlWeb('')).toBe(false)
  })

  it('valida el nombre y la dirección de un enlace', () => {
    expect(() => validarEnlace({ nombre: ' ' })).toThrow(EnlaceInvalido)
    expect(() => validarEnlace({ url: 'javascript:alert(1)' })).toThrow(/https/)
    expect(validarEnlace({ nombre: ' Biblioteca ', url: ' https://b.co ' })).toEqual({ nombre: 'Biblioteca', url: 'https://b.co' })
  })

  it('Facebook y mapa pueden quedar vacíos pero no ser inválidos', () => {
    expect(() => validarDireccionesWeb({ urlFacebook: '', urlMapa: 'https://maps.example.com' })).not.toThrow()
    expect(() => validarDireccionesWeb({ urlFacebook: 'javascript:1' })).toThrow(EnlaceInvalido)
  })
})
