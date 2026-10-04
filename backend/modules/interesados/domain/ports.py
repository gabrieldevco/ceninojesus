"""
Puertos (interfaces) que el dominio necesita del exterior.

La infraestructura los implementa como adaptadores; los casos de uso
dependen solo de estas abstracciones.
"""

from abc import ABC, abstractmethod
from datetime import datetime

from .entities import EstadoInteresado, Interesado, Seguimiento


class InteresadoRepository(ABC):
    @abstractmethod
    def guardar(self, interesado: Interesado) -> Interesado: ...

    @abstractmethod
    def obtener_por_id(self, interesado_id: int) -> Interesado | None: ...

    @abstractmethod
    def listar(self, estado: EstadoInteresado | None = None) -> list[Interesado]: ...

    @abstractmethod
    def listar_pendientes(self) -> list[Interesado]:
        """Interesados en estado nuevo o en seguimiento."""


class SeguimientoRepository(ABC):
    @abstractmethod
    def guardar(self, seguimiento: Seguimiento) -> Seguimiento: ...

    @abstractmethod
    def listar(self, interesado_id: int) -> list[Seguimiento]: ...

    @abstractmethod
    def eliminar_de(self, interesado_id: int) -> None:
        """Borra las notas de seguimiento (pueden contener datos personales)."""


class RecordatorioRepository(ABC):
    @abstractmethod
    def registrar(self, interesado_ids: list[int], fecha: datetime) -> None: ...

    @abstractmethod
    def ultimos(self, interesado_ids: list[int]) -> dict[int, datetime]:
        """Fecha del último recordatorio enviado por cada interesado."""
