from shared.domain.exceptions import DomainError, NotFoundError


class ContenidoNoEncontrado(NotFoundError):
    def __init__(self, contenido_id):
        super().__init__(f"No existe el contenido con id {contenido_id} en este grupo.")


class RecursoRequerido(DomainError):
    def __init__(self):
        super().__init__("El material debe tener un archivo o un enlace.")


class EnlaceRequerido(DomainError):
    def __init__(self):
        super().__init__("Un material de tipo enlace debe tener una URL.")


class SinArchivo(NotFoundError):
    def __init__(self):
        super().__init__("Este contenido no tiene archivo adjunto.")
