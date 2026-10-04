from modules.notificaciones.domain.entities import Notificacion
from modules.notificaciones.domain.exceptions import NotificacionNoEncontrada
from modules.notificaciones.domain.ports import NotificacionRepository
from shared.domain.actor import Actor


class ListarMisNotificaciones:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, actor: Actor, solo_no_leidas: bool = False) -> list[Notificacion]:
        return self.repository.listar_de_usuario(actor.id, solo_no_leidas)


class MarcarNotificacionLeida:
    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, actor: Actor, notificacion_id: int) -> Notificacion:
        notificacion = self.repository.obtener_por_id(notificacion_id)
        if notificacion is None:
            raise NotificacionNoEncontrada(notificacion_id)
        notificacion.marcar_leida(actor)
        return self.repository.guardar(notificacion)
