"""
Entidades del dominio de interesados.

Python puro: esta capa no importa Django ni ningún framework.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import StrEnum

from .exceptions import AutorizacionDatosRequerida, TransicionEstadoInvalida


class EstadoInteresado(StrEnum):
    NUEVO = "nuevo"
    EN_SEGUIMIENTO = "en_seguimiento"
    MATRICULADO = "matriculado"
    DESCARTADO = "descartado"


# Estados a los que se puede pasar desde cada estado (RF-19)
TRANSICIONES_PERMITIDAS = {
    EstadoInteresado.NUEVO: {
        EstadoInteresado.EN_SEGUIMIENTO,
        EstadoInteresado.MATRICULADO,
        EstadoInteresado.DESCARTADO,
    },
    EstadoInteresado.EN_SEGUIMIENTO: {
        EstadoInteresado.MATRICULADO,
        EstadoInteresado.DESCARTADO,
    },
    EstadoInteresado.MATRICULADO: set(),
    EstadoInteresado.DESCARTADO: set(),
}


def _ahora():
    return datetime.now(timezone.utc)


@dataclass
class Interesado:
    nombre_completo: str
    correo: str
    telefono: str
    autoriza_tratamiento_datos: bool
    mensaje: str = ""
    nombre_aspirante: str = ""
    grado_interes: str = ""
    estado: EstadoInteresado = EstadoInteresado.NUEVO
    fecha_registro: datetime = field(default_factory=_ahora)
    fecha_ultimo_contacto: datetime | None = None
    id: int | None = None

    def __post_init__(self):
        # Ley 1581 de 2012 (RNF-10): sin autorización no se almacenan datos
        if not self.autoriza_tratamiento_datos:
            raise AutorizacionDatosRequerida()

    def cambiar_estado(self, nuevo_estado: EstadoInteresado):
        if nuevo_estado not in TRANSICIONES_PERMITIDAS[self.estado]:
            raise TransicionEstadoInvalida(self.estado, nuevo_estado)
        self.estado = nuevo_estado
        self.fecha_ultimo_contacto = _ahora()

    def registrar_contacto(self):
        """Un contacto con el interesado lo pasa a seguimiento si aún era nuevo."""
        if self.estado == EstadoInteresado.NUEVO:
            self.estado = EstadoInteresado.EN_SEGUIMIENTO
        self.fecha_ultimo_contacto = _ahora()

    def anonimizar(self):
        """Ley 1581, supresión: borra los datos personales y saca al interesado del seguimiento."""
        self.nombre_completo = "Anónimo"
        self.correo = ""
        self.telefono = ""
        self.mensaje = ""
        self.nombre_aspirante = ""
        if self.esta_pendiente:
            self.estado = EstadoInteresado.DESCARTADO

    @property
    def esta_pendiente(self) -> bool:
        return self.estado in (EstadoInteresado.NUEVO, EstadoInteresado.EN_SEGUIMIENTO)

    def requiere_recordatorio(self, ahora: datetime, dias: int, ultimo_recordatorio: datetime | None) -> bool:
        """RF-18: pendiente, sin contacto en `dias` días y sin recordatorio en ese mismo plazo."""
        if not self.esta_pendiente:
            return False
        limite = ahora - timedelta(days=dias)
        sin_respuesta = (self.fecha_ultimo_contacto or self.fecha_registro) <= limite
        sin_recordatorio_reciente = ultimo_recordatorio is None or ultimo_recordatorio <= limite
        return sin_respuesta and sin_recordatorio_reciente


@dataclass
class Seguimiento:
    """Registro de cada contacto o gestión realizada con un interesado."""

    interesado_id: int
    usuario_id: int
    nota: str
    fecha: datetime = field(default_factory=_ahora)
    id: int | None = None
