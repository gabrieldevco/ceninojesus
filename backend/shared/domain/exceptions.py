class DomainError(Exception):
    """Error de regla de negocio. Base de todas las excepciones de dominio."""


class NotFoundError(DomainError):
    """La entidad solicitada no existe."""
