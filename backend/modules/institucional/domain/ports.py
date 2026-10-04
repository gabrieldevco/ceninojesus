from abc import ABC, abstractmethod

from .entities import EnlacePortal, InformacionInstitucional, MensajeContacto


class InformacionRepository(ABC):
    @abstractmethod
    def obtener(self) -> InformacionInstitucional | None: ...

    @abstractmethod
    def guardar(self, informacion: InformacionInstitucional) -> InformacionInstitucional: ...


class EnlaceRepository(ABC):
    @abstractmethod
    def guardar(self, enlace: EnlacePortal) -> EnlacePortal: ...

    @abstractmethod
    def obtener_por_id(self, enlace_id: int) -> EnlacePortal | None: ...

    @abstractmethod
    def listar(self) -> list[EnlacePortal]: ...

    @abstractmethod
    def eliminar(self, enlace_id: int) -> None: ...


class MensajeContactoRepository(ABC):
    @abstractmethod
    def guardar(self, mensaje: MensajeContacto) -> MensajeContacto: ...

    @abstractmethod
    def obtener_por_id(self, mensaje_id: int) -> MensajeContacto | None: ...

    @abstractmethod
    def listar(self, solo_no_leidos: bool = False) -> list[MensajeContacto]: ...
