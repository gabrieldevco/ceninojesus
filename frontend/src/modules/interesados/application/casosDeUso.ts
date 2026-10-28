import {
  transicionesPermitidas,
  validarNota,
  validarNuevoInteresado,
  type EstadoInteresado,
  type Interesado,
  type NuevoInteresado,
  type Seguimiento,
} from '../domain/interesado'
import type { RepositorioInteresados } from '../domain/puertos'

/** RF-16: una persona interesada en la matrícula deja sus datos para que admisiones la contacte. */
export class RegistrarInteresado {
  constructor(private readonly repositorio: RepositorioInteresados) {}

  async ejecutar(nuevo: NuevoInteresado): Promise<void> {
    await this.repositorio.registrar(validarNuevoInteresado(nuevo))
  }
}

export class ListarInteresados {
  constructor(private readonly repositorio: RepositorioInteresados) {}

  ejecutar(): Promise<Interesado[]> {
    return this.repositorio.listar()
  }
}

/** RF-19: el administrador actualiza el estado de cada interesado, solo por las transiciones válidas. */
export class CambiarEstadoInteresado {
  constructor(private readonly repositorio: RepositorioInteresados) {}

  async ejecutar(interesado: Pick<Interesado, 'id' | 'estado'>, nuevo: EstadoInteresado): Promise<Interesado> {
    if (!transicionesPermitidas(interesado.estado).includes(nuevo)) {
      throw new Error(`No se puede pasar de ${interesado.estado} a ${nuevo}`)
    }
    return this.repositorio.cambiarEstado(interesado.id, nuevo)
  }
}

export class ListarSeguimientos {
  constructor(private readonly repositorio: RepositorioInteresados) {}

  ejecutar(interesadoId: number): Promise<Seguimiento[]> {
    return this.repositorio.listarSeguimientos(interesadoId)
  }
}

/** Anota un contacto; reinicia el plazo de los recordatorios automáticos (RF-18). */
export class RegistrarSeguimiento {
  constructor(private readonly repositorio: RepositorioInteresados) {}

  async ejecutar(interesadoId: number, nota: string): Promise<Seguimiento> {
    return this.repositorio.registrarSeguimiento(interesadoId, validarNota(nota))
  }
}
