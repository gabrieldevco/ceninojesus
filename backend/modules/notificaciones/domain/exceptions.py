from shared.domain.exceptions import NotFoundError


class NotificacionNoEncontrada(NotFoundError):
    def __init__(self, notificacion_id):
        super().__init__(f"No existe la notificación con id {notificacion_id}.")
