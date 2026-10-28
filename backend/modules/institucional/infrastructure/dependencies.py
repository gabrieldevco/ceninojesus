from modules.institucional.application import use_cases
from modules.notificaciones.infrastructure.dependencies import get_notificador

from .repositories import (
    DjangoElementoLandingRepository,
    DjangoEnlaceRepository,
    DjangoInformacionRepository,
    DjangoMensajeContactoRepository,
)


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


def listar_elementos():
    return use_cases.ListarElementos(DjangoElementoLandingRepository())


def crear_elemento():
    return use_cases.CrearElemento(DjangoElementoLandingRepository())


def actualizar_elemento():
    return use_cases.ActualizarElemento(DjangoElementoLandingRepository())


def eliminar_elemento():
    return use_cases.EliminarElemento(DjangoElementoLandingRepository())


def subir_imagen_elemento():
    return use_cases.SubirImagenElemento(DjangoElementoLandingRepository())


def reemplazar_imagen_unica():
    return use_cases.ReemplazarImagenUnica(DjangoElementoLandingRepository())


def quitar_imagen_elemento():
    return use_cases.QuitarImagenElemento(DjangoElementoLandingRepository())


def obtener_ruta_imagen():
    return use_cases.ObtenerRutaImagen(DjangoElementoLandingRepository())
