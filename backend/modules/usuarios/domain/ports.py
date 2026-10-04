from abc import ABC, abstractmethod

from shared.domain.actor import Rol

from .entities import Estudiante, Usuario


class UsuarioRepository(ABC):
    @abstractmethod
    def crear(self, usuario: Usuario, password: str) -> Usuario: ...

    @abstractmethod
    def actualizar(self, usuario: Usuario) -> Usuario: ...

    @abstractmethod
    def obtener_por_id(self, usuario_id: int) -> Usuario | None: ...

    @abstractmethod
    def existe_nombre_usuario(self, nombre_usuario: str) -> bool: ...

    @abstractmethod
    def listar(self, rol: Rol | None = None) -> list[Usuario]: ...

    @abstractmethod
    def buscar_para_recuperacion(self, identificador: str) -> list[Usuario]:
        """Usuarios activos cuyo nombre de usuario o correo coincide con el identificador."""

    @abstractmethod
    def verificar_password(self, usuario_id: int, password: str) -> bool: ...

    @abstractmethod
    def cambiar_password(self, usuario_id: int, password: str) -> None: ...

    @abstractmethod
    def inhabilitar_acceso(self, usuario_id: int) -> None:
        """Deja al usuario sin contraseña utilizable."""


class EstudianteRepository(ABC):
    @abstractmethod
    def guardar(self, estudiante: Estudiante) -> Estudiante: ...

    @abstractmethod
    def obtener_por_id(self, estudiante_id: int) -> Estudiante | None: ...

    @abstractmethod
    def listar(self, acudiente_id: int | None = None) -> list[Estudiante]: ...


class TokensRecuperacion(ABC):
    """Genera y valida los códigos de un solo uso para restablecer la contraseña."""

    @abstractmethod
    def generar(self, usuario_id: int) -> tuple[str, str]:
        """Devuelve (uid, token) para incluir en el enlace."""

    @abstractmethod
    def validar(self, uid: str, token: str) -> int | None:
        """Devuelve el id del usuario si el código es válido y vigente."""
