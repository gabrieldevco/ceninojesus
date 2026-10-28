import {
  contarPorEstado,
  estaVencida,
  hoyIso,
  RespuestaRequerida,
  SolicitudInvalida,
  validarNuevaSolicitud,
  validarRespuesta,
  type NuevaSolicitud,
} from './solicitud'

const NUEVA: NuevaSolicitud = {
  nombre: ' María López ',
  correo: ' maria@example.com ',
  documentoIdentidad: ' 123 ',
  tipo: 'supresion',
  descripcion: ' Borren mis datos ',
}

describe('validarNuevaSolicitud', () => {
  it('limpia los espacios de una solicitud válida', () => {
    expect(validarNuevaSolicitud(NUEVA)).toEqual({
      nombre: 'María López',
      correo: 'maria@example.com',
      documentoIdentidad: '123',
      tipo: 'supresion',
      descripcion: 'Borren mis datos',
    })
  })

  it('reporta todos los campos obligatorios a la vez', () => {
    try {
      validarNuevaSolicitud({ ...NUEVA, nombre: '', correo: 'x', descripcion: ' ' })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(SolicitudInvalida)
      expect(Object.keys((error as SolicitudInvalida).campos).sort()).toEqual(['correo', 'descripcion', 'nombre'])
    }
  })

  it('el documento es opcional', () => {
    expect(validarNuevaSolicitud({ ...NUEVA, documentoIdentidad: '' }).documentoIdentidad).toBe('')
  })
})

describe('validarRespuesta', () => {
  it('exige texto y lo limpia', () => {
    expect(validarRespuesta('  Listo  ')).toBe('Listo')
    expect(() => validarRespuesta('   ')).toThrow(RespuestaRequerida)
  })
})

describe('plazos', () => {
  it('una solicitud sin resolver es vencida solo después de su fecha límite', () => {
    expect(estaVencida({ estado: 'recibida', fechaLimite: '2026-10-10' }, '2026-10-11')).toBe(true)
    expect(estaVencida({ estado: 'en_tramite', fechaLimite: '2026-10-10' }, '2026-10-10')).toBe(false)
  })

  it('una solicitud resuelta nunca figura como vencida', () => {
    expect(estaVencida({ estado: 'resuelta', fechaLimite: '2020-01-01' }, '2026-10-11')).toBe(false)
  })

  it('formatea hoy con la hora local', () => {
    expect(hoyIso(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('cuenta por estado', () => {
    expect(contarPorEstado([{ estado: 'recibida' }, { estado: 'recibida' }, { estado: 'resuelta' }], 'recibida')).toBe(2)
  })
})
