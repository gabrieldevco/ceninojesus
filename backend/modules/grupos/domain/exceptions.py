from shared.domain.exceptions import DomainError, NotFoundError


class GrupoNoEncontrado(NotFoundError):
    def __init__(self, grupo_id):
        super().__init__(f"No existe el grupo con id {grupo_id}.")


class SolicitudNoEncontrada(NotFoundError):
    def __init__(self, solicitud_id):
        super().__init__(f"No existe la solicitud con id {solicitud_id}.")


class GrupoInactivo(DomainError):
    def __init__(self):
        super().__init__("El grupo no está recibiendo matrículas.")


class SolicitudDuplicada(DomainError):
    def __init__(self):
        super().__init__("El estudiante ya tiene una solicitud pendiente o aprobada en este grupo.")


class SolicitudYaResuelta(DomainError):
    def __init__(self, estado):
        super().__init__(f"La solicitud ya fue resuelta (estado: {estado}).")


class MotivoRechazoRequerido(DomainError):
    def __init__(self):
        super().__init__("Debe indicar el motivo del rechazo.")


class CupoAgotado(DomainError):
    def __init__(self):
        super().__init__("El grupo no tiene cupos disponibles.")


class EstudianteNoPertenece(DomainError):
    def __init__(self):
        super().__init__("El estudiante no existe o no está a cargo de este acudiente.")


class AdministradoresInvalidos(DomainError):
    def __init__(self, ids):
        super().__init__(f"Estos usuarios no tienen rol de administrador de grupo: {sorted(ids)}.")
