from abc import ABC, abstractmethod

from shared.domain.actor import Rol

from .entities import EstadoSolicitud, EstudianteResumen, GrupoExtracurricular, SolicitudMatricula


class GrupoRepository(ABC):
    @abstractmethod
    def guardar(self, grupo: GrupoExtracurricular) -> GrupoExtracurricular: ...

    @abstractmethod
    def obtener_por_id(self, grupo_id: int) -> GrupoExtracurricular | None: ...

    @abstractmethod
    def listar(
        self, solo_activos: bool = False, administrador_id: int | None = None, ids: list[int] | None = None
    ) -> list[GrupoExtracurricular]: ...


class SolicitudRepository(ABC):
    @abstractmethod
    def guardar(self, solicitud: SolicitudMatricula) -> SolicitudMatricula: ...

    @abstractmethod
    def obtener_por_id(self, solicitud_id: int) -> SolicitudMatricula | None: ...

    @abstractmethod
    def listar(
        self,
        grupo_ids: list[int] | None = None,
        acudiente_id: int | None = None,
        estudiante_ids: list[int] | None = None,
        estado: EstadoSolicitud | None = None,
    ) -> list[SolicitudMatricula]: ...

    @abstractmethod
    def existe_activa(self, estudiante_id: int, grupo_id: int) -> bool: ...

    @abstractmethod
    def contar_aprobadas(self, grupo_id: int) -> int: ...


class DirectorioUsuarios(ABC):
    """Consulta de estudiantes y usuarios que vive en el módulo usuarios."""

    @abstractmethod
    def obtener_estudiante(self, estudiante_id: int) -> EstudianteResumen | None: ...

    @abstractmethod
    def estudiante_de_usuario(self, usuario_id: int) -> EstudianteResumen | None: ...

    @abstractmethod
    def estudiantes_de_acudiente(self, acudiente_id: int) -> list[EstudianteResumen]: ...

    @abstractmethod
    def ids_con_rol(self, usuario_ids: list[int], rol: Rol) -> set[int]: ...
