import {
  contarPorRol,
  DatosInvalidos,
  estaAnonimizada,
  validarDatosDeGrupo,
  validarNuevaCuenta,
  type CuentaDeUsuario,
  type DatosDeGrupo,
  type NuevaCuenta,
} from './administracion'

const CUENTA: NuevaCuenta = {
  nombreUsuario: ' profe.ajedrez ',
  password: 'clave-segura-123',
  rol: 'administrador_grupo',
  correo: ' profe@example.com ',
  nombres: ' Ana ',
  apellidos: ' Pérez ',
}

const GRUPO: DatosDeGrupo = { nombre: ' Ajedrez ', descripcion: ' ', horario: ' Martes ', cupoMaximo: 20, activo: true }

describe('validarNuevaCuenta', () => {
  it('limpia los espacios de una cuenta válida', () => {
    expect(validarNuevaCuenta(CUENTA)).toMatchObject({
      nombreUsuario: 'profe.ajedrez',
      correo: 'profe@example.com',
      nombres: 'Ana',
      apellidos: 'Pérez',
    })
  })

  it('exige usuario sin espacios y contraseña de 8 caracteres', () => {
    try {
      validarNuevaCuenta({ ...CUENTA, nombreUsuario: 'a b', password: 'corta' })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(DatosInvalidos)
      expect(Object.keys((error as DatosInvalidos<NuevaCuenta>).campos).sort()).toEqual(['nombreUsuario', 'password'])
    }
  })

  it('el correo es opcional pero, si se escribe, debe ser válido', () => {
    expect(validarNuevaCuenta({ ...CUENTA, correo: '' }).correo).toBe('')
    expect(() => validarNuevaCuenta({ ...CUENTA, correo: 'x' })).toThrow(DatosInvalidos)
  })
})

describe('validarDatosDeGrupo', () => {
  it('limpia los espacios y acepta un grupo sin cupo', () => {
    expect(validarDatosDeGrupo({ ...GRUPO, cupoMaximo: null })).toEqual({
      nombre: 'Ajedrez',
      descripcion: '',
      horario: 'Martes',
      cupoMaximo: null,
      activo: true,
    })
  })

  it('exige nombre y un cupo entero mayor que cero', () => {
    expect(() => validarDatosDeGrupo({ ...GRUPO, nombre: ' ' })).toThrow(DatosInvalidos)
    expect(() => validarDatosDeGrupo({ ...GRUPO, cupoMaximo: 0 })).toThrow(DatosInvalidos)
    expect(() => validarDatosDeGrupo({ ...GRUPO, cupoMaximo: 2.5 })).toThrow(DatosInvalidos)
  })
})

describe('cuentas', () => {
  const cuenta = (nombreUsuario: string, rol: CuentaDeUsuario['rol'], activo: boolean): CuentaDeUsuario => ({
    id: 1,
    nombreUsuario,
    rol,
    correo: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    activo,
  })

  it('reconoce las cuentas anonimizadas', () => {
    expect(estaAnonimizada(cuenta('anonimo-7', 'acudiente', false))).toBe(true)
    expect(estaAnonimizada(cuenta('maria', 'acudiente', true))).toBe(false)
  })

  it('cuenta solo las activas de cada rol', () => {
    const cuentas = [cuenta('a', 'acudiente', true), cuenta('b', 'acudiente', false), cuenta('c', 'estudiante', true)]
    expect(contarPorRol(cuentas, 'acudiente')).toBe(1)
  })
})
