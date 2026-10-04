from abc import ABC, abstractmethod


class Notificador(ABC):
    """Puerto para avisar a usuarios del sistema (RF-08, RF-11, RF-18)."""

    @abstractmethod
    def notificar(self, usuario_ids: list[int], titulo: str, mensaje: str) -> None: ...

    @abstractmethod
    def notificar_administradores(self, titulo: str, mensaje: str) -> None: ...


class EnviadorCorreo(ABC):
    """Puerto para escribir a cualquier dirección de correo, tenga o no cuenta en el sistema."""

    @abstractmethod
    def enviar(self, destinatarios: list[str], asunto: str, mensaje: str) -> None: ...
