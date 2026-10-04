from modules.grupos.application import use_cases
from modules.notificaciones.infrastructure.dependencies import get_notificador

from .directorio import DjangoDirectorioUsuarios
from .repositories import DjangoGrupoRepository, DjangoSolicitudRepository


def listar_grupos():
    return use_cases.ListarGrupos(DjangoGrupoRepository())


def obtener_grupo():
    return use_cases.ObtenerGrupo(DjangoGrupoRepository())


def crear_grupo():
    return use_cases.CrearGrupo(DjangoGrupoRepository())


def actualizar_grupo():
    return use_cases.ActualizarGrupo(DjangoGrupoRepository())


def asignar_administradores():
    return use_cases.AsignarAdministradores(DjangoGrupoRepository(), DjangoDirectorioUsuarios())


def mis_grupos():
    return use_cases.MisGrupos(DjangoGrupoRepository(), DjangoSolicitudRepository(), DjangoDirectorioUsuarios())


def listar_inscritos():
    return use_cases.ListarInscritos(DjangoGrupoRepository(), DjangoSolicitudRepository(), DjangoDirectorioUsuarios())


def consultar_acceso_grupo():
    return use_cases.ConsultarAccesoGrupo(
        DjangoGrupoRepository(), DjangoSolicitudRepository(), DjangoDirectorioUsuarios()
    )


def solicitar_matricula():
    return use_cases.SolicitarMatricula(
        DjangoSolicitudRepository(), DjangoGrupoRepository(), DjangoDirectorioUsuarios(), get_notificador()
    )


def listar_solicitudes():
    return use_cases.ListarSolicitudes(DjangoSolicitudRepository(), DjangoGrupoRepository())


def aprobar_solicitud():
    return use_cases.AprobarSolicitud(DjangoSolicitudRepository(), DjangoGrupoRepository(), get_notificador())


def rechazar_solicitud():
    return use_cases.RechazarSolicitud(DjangoSolicitudRepository(), DjangoGrupoRepository(), get_notificador())
