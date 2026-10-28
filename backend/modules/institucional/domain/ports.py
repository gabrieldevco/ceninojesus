from abc import ABC, abstractmethod

from .entities import ElementoLanding, EnlacePortal, InformacionInstitucional, MensajeContacto, SeccionLanding


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


class ElementoLandingRepository(ABC):
    @abstractmethod
    def guardar(self, elemento: ElementoLanding) -> ElementoLanding: ...

    @abstractmethod
    def obtener_por_id(self, elemento_id: int) -> ElementoLanding | None: ...

    @abstractmethod
    def listar(self, seccion: SeccionLanding | None = None) -> list[ElementoLanding]: ...

    @abstractmethod
    def obtener_unico(self, seccion: SeccionLanding) -> ElementoLanding | None:
        """El elemento de una sección de imagen única, si existe."""

    @abstractmethod
    def eliminar(self, elemento_id: int) -> None: ...

    @abstractmethod
    def guardar_imagen(self, elemento_id: int, archivo) -> ElementoLanding:
        """Reemplaza la imagen subida del elemento."""

    @abstractmethod
    def quitar_imagen(self, elemento_id: int) -> ElementoLanding: ...

    @abstractmethod
    def ruta_imagen(self, elemento_id: int) -> str | None:
        """Ruta de almacenamiento de la imagen subida, o None si no tiene."""
