from abc import ABC, abstractmethod
from typing import Any

from shared.domain.actor import Actor

from .entities import Contenido


class ContenidoRepository(ABC):
    """Repositorio común para materiales y actividades."""

    @abstractmethod
    def guardar(self, contenido: Contenido) -> Contenido: ...

    @abstractmethod
    def obtener_por_id(self, contenido_id: int) -> Contenido | None: ...

    @abstractmethod
    def listar(self, grupo_id: int, solo_publicados: bool = False) -> list[Contenido]: ...

    @abstractmethod
    def eliminar(self, contenido_id: int) -> None: ...


class AccesoGrupos(ABC):
    """Reglas de acceso que viven en el módulo grupos (RF-14)."""

    @abstractmethod
    def puede_gestionar(self, actor: Actor, grupo_id: int) -> bool: ...

    @abstractmethod
    def puede_ver(self, actor: Actor, grupo_id: int) -> bool: ...


class AlmacenArchivos(ABC):
    @abstractmethod
    def guardar(self, archivo: Any, carpeta: str) -> str:
        """Guarda el archivo y devuelve su ruta."""

    @abstractmethod
    def eliminar(self, ruta: str) -> None: ...
