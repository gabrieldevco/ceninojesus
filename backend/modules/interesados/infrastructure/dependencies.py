"""
Composición del módulo: conecta los casos de uso con sus adaptadores.

Es el único lugar donde se decide qué implementación concreta usa cada puerto.
"""

from modules.interesados.application import use_cases
from modules.notificaciones.infrastructure.dependencies import get_notificador

from .repositories import DjangoInteresadoRepository, DjangoRecordatorioRepository, DjangoSeguimientoRepository


def registrar_interesado():
    return use_cases.RegistrarInteresado(DjangoInteresadoRepository(), get_notificador())


def cambiar_estado_interesado():
    return use_cases.CambiarEstadoInteresado(DjangoInteresadoRepository())


def listar_interesados():
    return use_cases.ListarInteresados(DjangoInteresadoRepository())


def registrar_seguimiento():
    return use_cases.RegistrarSeguimiento(DjangoInteresadoRepository(), DjangoSeguimientoRepository())


def listar_seguimientos():
    return use_cases.ListarSeguimientos(DjangoInteresadoRepository(), DjangoSeguimientoRepository())


def anonimizar_interesado():
    return use_cases.AnonimizarInteresado(DjangoInteresadoRepository(), DjangoSeguimientoRepository())


def enviar_recordatorios():
    return use_cases.EnviarRecordatoriosSeguimiento(
        DjangoInteresadoRepository(), DjangoRecordatorioRepository(), get_notificador()
    )
