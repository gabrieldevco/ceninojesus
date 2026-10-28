"""Casos de uso de grupos extracurriculares y matrículas (RF-07 a RF-11)."""

from dataclasses import dataclass, replace

from modules.grupos.domain.entities import (
    EstadoSolicitud,
    EstudianteResumen,
    GrupoExtracurricular,
    SolicitudMatricula,
)
from modules.grupos.domain.exceptions import (
    AdministradoresInvalidos,
    CupoAgotado,
    EstudianteNoPertenece,
    GrupoDuplicado,
    GrupoInactivo,
    GrupoNoEncontrado,
    SolicitudDuplicada,
    SolicitudNoEncontrada,
)
from modules.grupos.domain.ports import DirectorioUsuarios, GrupoRepository, SolicitudRepository
from shared.domain.actor import Actor, Rol
from shared.domain.exceptions import PermisoDenegado
from shared.domain.notificaciones import Notificador


def _obtener_grupo(repository: GrupoRepository, grupo_id: int) -> GrupoExtracurricular:
    grupo = repository.obtener_por_id(grupo_id)
    if grupo is None:
        raise GrupoNoEncontrado(grupo_id)
    return grupo


def _obtener_grupo_gestionable(repository: GrupoRepository, actor: Actor, grupo_id: int) -> GrupoExtracurricular:
    grupo = _obtener_grupo(repository, grupo_id)
    if not grupo.es_gestionado_por(actor):
        raise PermisoDenegado("No administra este grupo.")
    return grupo


# --- Grupos ---


class ListarGrupos:
    def __init__(self, repository: GrupoRepository):
        self.repository = repository

    def execute(self, solo_activos: bool = True) -> list[GrupoExtracurricular]:
        return self.repository.listar(solo_activos=solo_activos)


class ObtenerGrupo:
    def __init__(self, repository: GrupoRepository):
        self.repository = repository

    def execute(self, grupo_id: int) -> GrupoExtracurricular:
        return _obtener_grupo(self.repository, grupo_id)


@dataclass(frozen=True)
class DatosGrupo:
    nombre: str
    descripcion: str = ""
    horario: str = ""
    cupo_maximo: int | None = None
    activo: bool = True


class CrearGrupo:
    """RNF-05: crear un grupo nuevo no requiere cambios en el sistema."""

    def __init__(self, repository: GrupoRepository):
        self.repository = repository

    def execute(self, datos: DatosGrupo) -> GrupoExtracurricular:
        if self.repository.existe_nombre(datos.nombre):
            raise GrupoDuplicado(datos.nombre)
        return self.repository.guardar(GrupoExtracurricular(**datos.__dict__))


class ActualizarGrupo:
    def __init__(self, repository: GrupoRepository):
        self.repository = repository

    def execute(self, actor: Actor, grupo_id: int, cambios: dict) -> GrupoExtracurricular:
        grupo = _obtener_grupo_gestionable(self.repository, actor, grupo_id)
        nombre = cambios.get("nombre")
        if nombre is not None and self.repository.existe_nombre(nombre, excepto_id=grupo_id):
            raise GrupoDuplicado(nombre)
        return self.repository.guardar(replace(grupo, **cambios))


class AsignarAdministradores:
    """Solo el administrador general define quién administra cada grupo."""

    def __init__(self, repository: GrupoRepository, directorio: DirectorioUsuarios):
        self.repository = repository
        self.directorio = directorio

    def execute(self, grupo_id: int, administrador_ids: list[int]) -> GrupoExtracurricular:
        grupo = _obtener_grupo(self.repository, grupo_id)
        validos = self.directorio.ids_con_rol(administrador_ids, Rol.ADMINISTRADOR_GRUPO)
        invalidos = set(administrador_ids) - validos
        if invalidos:
            raise AdministradoresInvalidos(invalidos)
        grupo.administrador_ids = sorted(validos)
        return self.repository.guardar(grupo)


class MisGrupos:
    """Grupos relacionados con el actor según su rol."""

    def __init__(self, repository: GrupoRepository, solicitudes: SolicitudRepository, directorio: DirectorioUsuarios):
        self.repository = repository
        self.solicitudes = solicitudes
        self.directorio = directorio

    def execute(self, actor: Actor) -> list[GrupoExtracurricular]:
        if actor.es_administrador:
            return self.repository.listar()
        if actor.rol == Rol.ADMINISTRADOR_GRUPO:
            return self.repository.listar(administrador_id=actor.id)

        if actor.rol == Rol.ESTUDIANTE:
            estudiante = self.directorio.estudiante_de_usuario(actor.id)
            estudiante_ids = [estudiante.id] if estudiante else []
        else:
            estudiante_ids = [e.id for e in self.directorio.estudiantes_de_acudiente(actor.id)]
        if not estudiante_ids:
            return []
        aprobadas = self.solicitudes.listar(estudiante_ids=estudiante_ids, estado=EstadoSolicitud.APROBADA)
        return self.repository.listar(ids=sorted({s.grupo_id for s in aprobadas}))


class ListarInscritos:
    """Estudiantes aprobados en un grupo, para su administrador."""

    def __init__(self, repository: GrupoRepository, solicitudes: SolicitudRepository, directorio: DirectorioUsuarios):
        self.repository = repository
        self.solicitudes = solicitudes
        self.directorio = directorio

    def execute(self, actor: Actor, grupo_id: int) -> list[EstudianteResumen]:
        _obtener_grupo_gestionable(self.repository, actor, grupo_id)
        aprobadas = self.solicitudes.listar(grupo_ids=[grupo_id], estado=EstadoSolicitud.APROBADA)
        estudiantes = (self.directorio.obtener_estudiante(s.estudiante_id) for s in aprobadas)
        return [e for e in estudiantes if e is not None]


class ConsultarAccesoGrupo:
    """RF-14: decide quién gestiona y quién puede ver el contenido de un grupo."""

    def __init__(self, repository: GrupoRepository, solicitudes: SolicitudRepository, directorio: DirectorioUsuarios):
        self.repository = repository
        self.solicitudes = solicitudes
        self.directorio = directorio

    def puede_gestionar(self, actor: Actor, grupo_id: int) -> bool:
        return _obtener_grupo(self.repository, grupo_id).es_gestionado_por(actor)

    def puede_ver(self, actor: Actor, grupo_id: int) -> bool:
        if self.puede_gestionar(actor, grupo_id):
            return True
        if actor.rol != Rol.ESTUDIANTE:
            return False
        estudiante = self.directorio.estudiante_de_usuario(actor.id)
        if estudiante is None:
            return False
        aprobadas = self.solicitudes.listar(
            grupo_ids=[grupo_id], estudiante_ids=[estudiante.id], estado=EstadoSolicitud.APROBADA
        )
        return bool(aprobadas)


# --- Solicitudes de matrícula ---


class SolicitarMatricula:
    """RF-07 / RF-08: el acudiente solicita la matrícula y se avisa a los administradores del grupo."""

    def __init__(
        self,
        repository: SolicitudRepository,
        grupos: GrupoRepository,
        directorio: DirectorioUsuarios,
        notificador: Notificador,
    ):
        self.repository = repository
        self.grupos = grupos
        self.directorio = directorio
        self.notificador = notificador

    def execute(self, actor: Actor, grupo_id: int, estudiante_id: int, comentario: str = "") -> SolicitudMatricula:
        if actor.rol != Rol.ACUDIENTE:
            raise PermisoDenegado("Solo los padres o acudientes pueden solicitar matrículas.")
        grupo = _obtener_grupo(self.grupos, grupo_id)
        if not grupo.activo:
            raise GrupoInactivo()
        estudiante = self.directorio.obtener_estudiante(estudiante_id)
        if estudiante is None or estudiante.acudiente_id != actor.id:
            raise EstudianteNoPertenece()
        if self.repository.existe_activa(estudiante_id, grupo_id):
            raise SolicitudDuplicada()

        solicitud = self.repository.guardar(
            SolicitudMatricula(
                grupo_id=grupo_id,
                estudiante_id=estudiante_id,
                acudiente_id=actor.id,
                comentario=comentario,
            )
        )
        destinatarios = grupo.administrador_ids
        titulo = f"Nueva solicitud de matrícula en {grupo.nombre}"
        mensaje = f"Se recibió una solicitud para {estudiante.nombre_completo}. Ingrese a la plataforma para revisarla."
        if destinatarios:
            self.notificador.notificar(destinatarios, titulo, mensaje)
        else:
            self.notificador.notificar_administradores(titulo, mensaje)
        return solicitud


class ListarSolicitudes:
    def __init__(self, repository: SolicitudRepository, grupos: GrupoRepository):
        self.repository = repository
        self.grupos = grupos

    def execute(
        self, actor: Actor, estado: EstadoSolicitud | None = None, grupo_id: int | None = None
    ) -> list[SolicitudMatricula]:
        grupo_ids = [grupo_id] if grupo_id else None
        if actor.es_administrador:
            return self.repository.listar(grupo_ids=grupo_ids, estado=estado)
        if actor.rol == Rol.ACUDIENTE:
            return self.repository.listar(grupo_ids=grupo_ids, acudiente_id=actor.id, estado=estado)
        if actor.rol == Rol.ADMINISTRADOR_GRUPO:
            propios = {g.id for g in self.grupos.listar(administrador_id=actor.id)}
            if grupo_id is not None and grupo_id not in propios:
                raise PermisoDenegado("No administra este grupo.")
            return self.repository.listar(grupo_ids=grupo_ids or sorted(propios), estado=estado)
        raise PermisoDenegado()


class _ResolverSolicitud:
    def __init__(self, repository: SolicitudRepository, grupos: GrupoRepository, notificador: Notificador):
        self.repository = repository
        self.grupos = grupos
        self.notificador = notificador

    def _obtener(self, actor: Actor, solicitud_id: int) -> tuple[SolicitudMatricula, GrupoExtracurricular]:
        solicitud = self.repository.obtener_por_id(solicitud_id)
        if solicitud is None:
            raise SolicitudNoEncontrada(solicitud_id)
        grupo = _obtener_grupo_gestionable(self.grupos, actor, solicitud.grupo_id)
        return solicitud, grupo

    def _notificar_acudiente(self, solicitud: SolicitudMatricula, grupo: GrupoExtracurricular):
        # RF-11
        if solicitud.estado == EstadoSolicitud.APROBADA:
            titulo = f"Matrícula aprobada en {grupo.nombre}"
            mensaje = f"La solicitud de {solicitud.estudiante_nombre} en {grupo.nombre} fue aprobada."
        else:
            titulo = f"Matrícula rechazada en {grupo.nombre}"
            mensaje = f"La solicitud de {solicitud.estudiante_nombre} en {grupo.nombre} fue rechazada."
        if solicitud.respuesta:
            mensaje += f"\n\nRespuesta del administrador: {solicitud.respuesta}"
        self.notificador.notificar([solicitud.acudiente_id], titulo, mensaje)


class AprobarSolicitud(_ResolverSolicitud):
    """RF-09 / RF-10 / RF-11."""

    def execute(self, actor: Actor, solicitud_id: int, respuesta: str = "") -> SolicitudMatricula:
        solicitud, grupo = self._obtener(actor, solicitud_id)
        if not grupo.tiene_cupo(self.repository.contar_aprobadas(grupo.id)):
            raise CupoAgotado()
        solicitud.aprobar(actor, respuesta)
        solicitud = self.repository.guardar(solicitud)
        self._notificar_acudiente(solicitud, grupo)
        return solicitud


class RechazarSolicitud(_ResolverSolicitud):
    """RF-09 / RF-10 / RF-11."""

    def execute(self, actor: Actor, solicitud_id: int, motivo: str) -> SolicitudMatricula:
        solicitud, grupo = self._obtener(actor, solicitud_id)
        solicitud.rechazar(actor, motivo)
        solicitud = self.repository.guardar(solicitud)
        self._notificar_acudiente(solicitud, grupo)
        return solicitud
