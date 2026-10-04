from shared.domain.exceptions import DomainError, NotFoundError


class NombreUsuarioEnUso(DomainError):
    def __init__(self, nombre_usuario):
        super().__init__(f"El nombre de usuario '{nombre_usuario}' ya está en uso.")


class UsuarioNoEncontrado(NotFoundError):
    def __init__(self, usuario_id):
        super().__init__(f"No existe el usuario con id {usuario_id}.")


class EstudianteNoEncontrado(NotFoundError):
    def __init__(self, estudiante_id):
        super().__init__(f"No existe el estudiante con id {estudiante_id}.")


class EstudianteYaTieneAcceso(DomainError):
    def __init__(self):
        super().__init__("El estudiante ya tiene un usuario de acceso.")


class EstudianteSinAcceso(DomainError):
    def __init__(self):
        super().__init__("El estudiante aún no tiene usuario de acceso.")


class AcudienteInvalido(DomainError):
    def __init__(self):
        super().__init__("El acudiente indicado no existe o no tiene rol de acudiente.")


class AutorizacionDatosRequerida(DomainError):
    def __init__(self):
        super().__init__("Se requiere la autorización para el tratamiento de datos personales.")


class EnlaceRecuperacionInvalido(DomainError):
    def __init__(self):
        super().__init__("El enlace para restablecer la contraseña no es válido o ya venció. Solicite uno nuevo.")


class ContrasenaIncorrecta(DomainError):
    def __init__(self):
        super().__init__("La contraseña actual no es correcta.")
