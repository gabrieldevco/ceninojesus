from shared.domain.exceptions import DomainError, NotFoundError


class AutorizacionDatosRequerida(DomainError):
    def __init__(self):
        super().__init__("Se requiere la autorización para el tratamiento de datos personales.")


class EnlaceNoEncontrado(NotFoundError):
    def __init__(self, enlace_id):
        super().__init__(f"No existe el enlace con id {enlace_id}.")


class MensajeNoEncontrado(NotFoundError):
    def __init__(self, mensaje_id):
        super().__init__(f"No existe el mensaje con id {mensaje_id}.")
