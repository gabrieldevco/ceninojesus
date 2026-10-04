from modules.datos_personales.application import use_cases
from modules.notificaciones.infrastructure.dependencies import get_enviador_correo, get_notificador

from .repositories import DjangoSolicitudDatosRepository


def radicar_solicitud():
    return use_cases.RadicarSolicitudDatos(DjangoSolicitudDatosRepository(), get_notificador(), get_enviador_correo())


def listar_solicitudes():
    return use_cases.ListarSolicitudesDatos(DjangoSolicitudDatosRepository())


def tramitar_solicitud():
    return use_cases.TramitarSolicitudDatos(DjangoSolicitudDatosRepository())


def responder_solicitud():
    return use_cases.ResponderSolicitudDatos(DjangoSolicitudDatosRepository(), get_enviador_correo())


def alertar_por_vencer():
    return use_cases.AlertarSolicitudesPorVencer(DjangoSolicitudDatosRepository(), get_notificador())
