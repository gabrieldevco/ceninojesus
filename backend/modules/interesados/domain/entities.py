"""
Entidades del dominio de interesados.

Python puro: esta capa no importa Django ni ningún framework.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
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
