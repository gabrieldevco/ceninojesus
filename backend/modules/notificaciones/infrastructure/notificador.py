"""
Adaptador del puerto Notificador: guarda la notificación en la aplicación
y envía una copia por correo a quienes tengan correo registrado.
"""

from django.contrib.auth import get_user_model

from modules.notificaciones.domain.entities import Notificacion
from shared.domain.actor import Rol
from shared.domain.notificaciones import Notificador

from .correo import DjangoEnviadorCorreo
from .repositories import DjangoNotificacionRepository


class DjangoNotificador(Notificador):
    def __init__(self, repository=None, correo=None):
        self.repository = repository or DjangoNotificacionRepository()
        self.correo = correo or DjangoEnviadorCorreo()

    def notificar(self, usuario_ids: list[int], titulo: str, mensaje: str) -> None:
        usuarios = list(get_user_model().objects.filter(id__in=set(usuario_ids), is_active=True))
        for usuario in usuarios:
            self.repository.guardar(Notificacion(usuario_id=usuario.id, titulo=titulo, mensaje=mensaje))
        self.correo.enviar([u.correo for u in usuarios], titulo, mensaje)

    def notificar_administradores(self, titulo: str, mensaje: str) -> None:
        administradores = get_user_model().objects.filter(rol=Rol.ADMINISTRADOR, is_active=True)
        self.notificar(list(administradores.values_list("id", flat=True)), titulo, mensaje)
