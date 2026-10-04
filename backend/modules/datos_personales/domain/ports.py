from abc import ABC, abstractmethod

from .entities import EstadoSolicitudDatos, SolicitudDatos


class SolicitudDatosRepository(ABC):
    @abstractmethod
    def guardar(self, solicitud: SolicitudDatos) -> SolicitudDatos: ...

    @abstractmethod
    def obtener_por_id(self, solicitud_id: int) -> SolicitudDatos | None: ...

    @abstractmethod
    def listar(self, estado: EstadoSolicitudDatos | None = None) -> list[SolicitudDatos]: ...

    @abstractmethod
    def listar_sin_resolver(self) -> list[SolicitudDatos]: ...
