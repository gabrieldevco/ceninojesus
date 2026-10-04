from shared.domain.exceptions import DomainError, NotFoundError


class SolicitudDatosNoEncontrada(NotFoundError):
    def __init__(self, solicitud_id):
        super().__init__(f"No existe la solicitud con id {solicitud_id}.")


class SolicitudYaResuelta(DomainError):
    def __init__(self):
        super().__init__("La solicitud ya fue resuelta.")


class RespuestaRequerida(DomainError):
    def __init__(self):
        super().__init__("Debe escribir la respuesta para el titular.")
