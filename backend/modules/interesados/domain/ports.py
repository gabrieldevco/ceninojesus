"""
Puertos (interfaces) que el dominio necesita del exterior.

La infraestructura los implementa como adaptadores; los casos de uso
dependen solo de estas abstracciones.
"""

from abc import ABC, abstractmethod

from .entities import EstadoInteresado, Interesado


class InteresadoRepository(ABC):
    @abstractmethod
    def guardar(self, interesado: Interesado) -> Interesado: ...

    @abstractmethod
    def obtener_por_id(self, interesado_id: int) -> Interesado | None: ...

    @abstractmethod
    def listar(self, estado: EstadoInteresado | None = None) -> list[Interesado]: ...
