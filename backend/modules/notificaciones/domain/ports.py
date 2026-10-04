from abc import ABC, abstractmethod

from .entities import Notificacion


class NotificacionRepository(ABC):
    @abstractmethod
    def guardar(self, notificacion: Notificacion) -> Notificacion: ...

    @abstractmethod
    def obtener_por_id(self, notificacion_id: int) -> Notificacion | None: ...

    @abstractmethod
    def listar_de_usuario(self, usuario_id: int, solo_no_leidas: bool = False) -> list[Notificacion]: ...
