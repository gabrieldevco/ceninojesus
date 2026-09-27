"""
Composición del módulo: conecta los casos de uso con sus adaptadores.

Es el único lugar donde se decide qué implementación concreta usa cada puerto.
"""

from modules.interesados.application.use_cases import (
    CambiarEstadoInteresado,
    ListarInteresados,
    RegistrarInteresado,
)

from .repositories import DjangoInteresadoRepository


def get_repository():
    return DjangoInteresadoRepository()


def registrar_interesado():
    return RegistrarInteresado(get_repository())


def cambiar_estado_interesado():
    return CambiarEstadoInteresado(get_repository())


def listar_interesados():
    return ListarInteresados(get_repository())
