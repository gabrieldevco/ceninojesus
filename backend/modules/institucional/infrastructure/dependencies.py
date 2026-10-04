from modules.institucional.application import use_cases
from modules.notificaciones.infrastructure.dependencies import get_notificador

from .repositories import DjangoEnlaceRepository, DjangoInformacionRepository, DjangoMensajeContactoRepository


def obtener_informacion():
    return use_cases.ObtenerInformacion(DjangoInformacionRepository())


def actualizar_informacion():
    return use_cases.ActualizarInformacion(DjangoInformacionRepository())


def listar_enlaces():
    return use_cases.ListarEnlaces(DjangoEnlaceRepository())


def crear_enlace():
    return use_cases.CrearEnlace(DjangoEnlaceRepository())


def actualizar_enlace():
    return use_cases.ActualizarEnlace(DjangoEnlaceRepository())


def eliminar_enlace():
    return use_cases.EliminarEnlace(DjangoEnlaceRepository())


def enviar_mensaje_contacto():
    return use_cases.EnviarMensajeContacto(DjangoMensajeContactoRepository(), get_notificador())


def listar_mensajes():
    return use_cases.ListarMensajes(DjangoMensajeContactoRepository())


def marcar_mensaje_leido():
    return use_cases.MarcarMensajeLeido(DjangoMensajeContactoRepository())
