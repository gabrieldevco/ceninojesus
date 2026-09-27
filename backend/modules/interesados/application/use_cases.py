"""
Casos de uso del módulo de interesados.

Orquestan el dominio a través de los puertos; no conocen Django.
"""

from dataclasses import dataclass

from modules.interesados.domain.entities import EstadoInteresado, Interesado
from modules.interesados.domain.exceptions import InteresadoNoEncontrado
from modules.interesados.domain.ports import InteresadoRepository


@dataclass(frozen=True)
class RegistrarInteresadoCommand:
    nombre_completo: str
    email: str
    telefono: str
    autoriza_tratamiento_datos: bool
    mensaje: str = ""


class RegistrarInteresado:
    """RF-16 / RF-17: registrar a un interesado en la matrícula general."""

    def __init__(self, repository: InteresadoRepository):
        self.repository = repository

    def execute(self, command: RegistrarInteresadoCommand) -> Interesado:
        interesado = Interesado(
            nombre_completo=command.nombre_completo,
            email=command.email,
            telefono=command.telefono,
            autoriza_tratamiento_datos=command.autoriza_tratamiento_datos,
            mensaje=command.mensaje,
        )
        return self.repository.guardar(interesado)


class CambiarEstadoInteresado:
    """RF-19: actualizar el estado de seguimiento de un interesado."""

    def __init__(self, repository: InteresadoRepository):
        self.repository = repository

    def execute(self, interesado_id: int, nuevo_estado: EstadoInteresado) -> Interesado:
        interesado = self.repository.obtener_por_id(interesado_id)
        if interesado is None:
            raise InteresadoNoEncontrado(interesado_id)
        interesado.cambiar_estado(nuevo_estado)
        return self.repository.guardar(interesado)


class ListarInteresados:
    def __init__(self, repository: InteresadoRepository):
        self.repository = repository

    def execute(self, estado: EstadoInteresado | None = None) -> list[Interesado]:
        return self.repository.listar(estado)
