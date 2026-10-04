"""
Solicitudes de los titulares sobre sus datos personales (Ley 1581 de 2012, RNF-10).

Plazos (art. 14 y 15): consultas, 10 días hábiles; reclamos (actualización,
rectificación, supresión, revocatoria), 15 días hábiles.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from enum import StrEnum

from shared.domain.actor import Actor

from .exceptions import RespuestaRequerida, SolicitudYaResuelta


class TipoSolicitudDatos(StrEnum):
    CONSULTA = "consulta"
    ACTUALIZACION = "actualizacion"
    RECTIFICACION = "rectificacion"
    SUPRESION = "supresion"
    REVOCATORIA = "revocatoria"


class EstadoSolicitudDatos(StrEnum):
    RECIBIDA = "recibida"
    EN_TRAMITE = "en_tramite"
    RESUELTA = "resuelta"


PLAZO_DIAS_HABILES = {TipoSolicitudDatos.CONSULTA: 10}
PLAZO_RECLAMOS = 15


def sumar_dias_habiles(inicio: date, dias: int) -> date:
    """Suma días de lunes a viernes. No descuenta festivos: el plazo real puede ser algo mayor."""
    fecha = inicio
    while dias > 0:
        fecha += timedelta(days=1)
        if fecha.weekday() < 5:
            dias -= 1
    return fecha


def _ahora():
    return datetime.now(timezone.utc)


@dataclass
class SolicitudDatos:
    nombre: str
    correo: str
    tipo: TipoSolicitudDatos
    descripcion: str
    documento_identidad: str = ""
    usuario_id: int | None = None
    estado: EstadoSolicitudDatos = EstadoSolicitudDatos.RECIBIDA
    respuesta: str = ""
    fecha_solicitud: datetime = field(default_factory=_ahora)
    fecha_limite: date | None = None
    fecha_respuesta: datetime | None = None
    atendida_por_id: int | None = None
    fecha_ultima_alerta: date | None = None
    id: int | None = None

    def __post_init__(self):
        if self.fecha_limite is None:
            plazo = PLAZO_DIAS_HABILES.get(self.tipo, PLAZO_RECLAMOS)
            self.fecha_limite = sumar_dias_habiles(self.fecha_solicitud.date(), plazo)

    @property
    def resuelta(self) -> bool:
        return self.estado == EstadoSolicitudDatos.RESUELTA

    def tramitar(self, actor: Actor):
        if self.resuelta:
            raise SolicitudYaResuelta()
        self.estado = EstadoSolicitudDatos.EN_TRAMITE
        self.atendida_por_id = actor.id

    def responder(self, actor: Actor, respuesta: str):
        if self.resuelta:
            raise SolicitudYaResuelta()
        if not respuesta.strip():
            raise RespuestaRequerida()
        self.estado = EstadoSolicitudDatos.RESUELTA
        self.respuesta = respuesta
        self.fecha_respuesta = _ahora()
        self.atendida_por_id = actor.id

    def requiere_alerta(self, hoy: date, dias_anticipacion: int) -> bool:
        """Sin resolver, a `dias_anticipacion` días o menos del límite y sin alerta enviada hoy."""
        if self.resuelta or self.fecha_ultima_alerta == hoy:
            return False
        return (self.fecha_limite - hoy).days <= dias_anticipacion
