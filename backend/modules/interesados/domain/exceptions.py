from shared.domain.exceptions import DomainError, NotFoundError


class AutorizacionDatosRequerida(DomainError):
    def __init__(self):
        super().__init__("Se requiere la autorización para el tratamiento de datos personales.")


class TransicionEstadoInvalida(DomainError):
    def __init__(self, actual, nuevo):
        super().__init__(f"No se puede pasar del estado '{actual}' a '{nuevo}'.")


class InteresadoNoEncontrado(NotFoundError):
    def __init__(self, interesado_id):
        super().__init__(f"No existe el interesado con id {interesado_id}.")
