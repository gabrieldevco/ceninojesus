from modules.notificaciones.application.use_cases import ListarMisNotificaciones, MarcarNotificacionLeida

from .correo import DjangoEnviadorCorreo
from .notificador import DjangoNotificador
from .repositories import DjangoNotificacionRepository


def get_notificador():
    """Implementación del puerto Notificador que usan los demás módulos."""
    return DjangoNotificador()


def get_enviador_correo():
    """Implementación del puerto EnviadorCorreo que usan los demás módulos."""
    return DjangoEnviadorCorreo()


def listar_mis_notificaciones():
    return ListarMisNotificaciones(DjangoNotificacionRepository())


def marcar_notificacion_leida():
    return MarcarNotificacionLeida(DjangoNotificacionRepository())
