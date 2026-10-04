from django.conf import settings

from modules.notificaciones.infrastructure.dependencies import get_enviador_correo
from modules.usuarios.application import use_cases

from .repositories import DjangoEstudianteRepository, DjangoTokensRecuperacion, DjangoUsuarioRepository


def registrar_acudiente():
    return use_cases.RegistrarAcudiente(DjangoUsuarioRepository())


def crear_usuario():
    return use_cases.CrearUsuario(DjangoUsuarioRepository())


def listar_usuarios():
    return use_cases.ListarUsuarios(DjangoUsuarioRepository())


def obtener_usuario():
    return use_cases.ObtenerUsuario(DjangoUsuarioRepository())


def actualizar_usuario():
    return use_cases.ActualizarUsuario(DjangoUsuarioRepository())


def solicitar_recuperacion():
    return use_cases.SolicitarRecuperacion(
        DjangoUsuarioRepository(), DjangoTokensRecuperacion(), get_enviador_correo(), settings.FRONTEND_URL
    )


def confirmar_recuperacion():
    return use_cases.ConfirmarRecuperacion(DjangoUsuarioRepository(), DjangoTokensRecuperacion())


def cambiar_contrasena():
    return use_cases.CambiarContrasena(DjangoUsuarioRepository())


def anonimizar_usuario():
    return use_cases.AnonimizarUsuario(DjangoUsuarioRepository(), DjangoEstudianteRepository())


def registrar_estudiante():
    return use_cases.RegistrarEstudiante(DjangoEstudianteRepository(), DjangoUsuarioRepository())


def listar_estudiantes():
    return use_cases.ListarEstudiantes(DjangoEstudianteRepository())


def actualizar_estudiante():
    return use_cases.ActualizarEstudiante(DjangoEstudianteRepository())


def crear_acceso_estudiante():
    return use_cases.CrearAccesoEstudiante(DjangoEstudianteRepository(), DjangoUsuarioRepository())


def restablecer_contrasena_estudiante():
    return use_cases.RestablecerContrasenaEstudiante(DjangoEstudianteRepository(), DjangoUsuarioRepository())
