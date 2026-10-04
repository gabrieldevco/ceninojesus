from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum

from shared.domain.actor import Actor

from .exceptions import MotivoRechazoRequerido, SolicitudYaResuelta


def _ahora():
    return datetime.now(timezone.utc)


@dataclass
class GrupoExtracurricular:
    """Grupo como ajedrez o robótica. Cada uno tiene sus propios administradores (RNF-05)."""

    nombre: str
    descripcion: str = ""
    horario: str = ""
    cupo_maximo: int | None = None
    activo: bool = True
    administrador_ids: list[int] = field(default_factory=list)
    id: int | None = None

    def es_gestionado_por(self, actor: Actor) -> bool:
        return actor.es_administrador or actor.id in self.administrador_ids

    def tiene_cupo(self, aprobadas: int) -> bool:
        return self.cupo_maximo is None or aprobadas < self.cupo_maximo


class EstadoSolicitud(StrEnum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"


@dataclass
class SolicitudMatricula:
    """RF-07 a RF-11: solicitud de un acudiente para inscribir a un estudiante en un grupo."""

    grupo_id: int
    estudiante_id: int
    acudiente_id: int
    comentario: str = ""
    estado: EstadoSolicitud = EstadoSolicitud.PENDIENTE
    respuesta: str = ""
    fecha_solicitud: datetime = field(default_factory=_ahora)
    fecha_respuesta: datetime | None = None
    respondida_por_id: int | None = None
    id: int | None = None
    # Datos de lectura que completa el repositorio para mostrar
    grupo_nombre: str = ""
    estudiante_nombre: str = ""

    def aprobar(self, actor: Actor, respuesta: str = ""):
        self._resolver(actor, EstadoSolicitud.APROBADA, respuesta)

    def rechazar(self, actor: Actor, motivo: str):
        if not motivo.strip():
            raise MotivoRechazoRequerido()
        self._resolver(actor, EstadoSolicitud.RECHAZADA, motivo)

    def _resolver(self, actor: Actor, estado: EstadoSolicitud, respuesta: str):
        if self.estado != EstadoSolicitud.PENDIENTE:
            raise SolicitudYaResuelta(self.estado)
        self.estado = estado
        self.respuesta = respuesta
        self.fecha_respuesta = _ahora()
        self.respondida_por_id = actor.id


@dataclass(frozen=True)
class EstudianteResumen:
    """Lo que el módulo de grupos necesita saber de un estudiante (viene del módulo usuarios)."""

    id: int
    nombre_completo: str
    acudiente_id: int
    usuario_id: int | None = None
    grado: str = ""
