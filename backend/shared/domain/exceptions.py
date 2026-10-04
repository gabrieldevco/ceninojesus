class DomainError(Exception):
    """Error de regla de negocio. Base de todas las excepciones de dominio."""


class NotFoundError(DomainError):
    """La entidad solicitada no existe."""


class PermisoDenegado(DomainError):
    """El actor no tiene permiso para realizar la acción."""

    def __init__(self, mensaje="No tiene permiso para realizar esta acción."):
        super().__init__(mensaje)
