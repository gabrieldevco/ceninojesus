from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum

from .exceptions import AutorizacionDatosRequerida


def _ahora():
    return datetime.now(UTC)


@dataclass
class InformacionInstitucional:
    """RF-01 / RF-02: datos públicos del colegio. Existe un único registro."""

    nombre: str = ""
    historia: str = ""
    mision: str = ""
    vision: str = ""
    direccion: str = ""
    ciudad: str = ""
    telefonos: str = ""
    correo: str = ""
    horario_atencion: str = ""
    url_mapa: str = ""
    url_facebook: str = ""
    # Ley 1581 de 2012 (RNF-10): política publicada que el titular acepta al autorizar
    politica_tratamiento_datos: str = ""


class TipoEnlace(StrEnum):
    SISTEMA_ADMINISTRATIVO = "sistema_administrativo"
    BIBLIOTECA = "biblioteca"
    OTRO = "otro"


@dataclass
class EnlacePortal:
    """RF-04 / RF-05: acceso a los sistemas externos (notas, tareas, evidencias, biblioteca)."""

    nombre: str
    url: str
    tipo: TipoEnlace
    descripcion: str = ""
    requiere_autenticacion: bool = False
    orden: int = 0
    activo: bool = True
    id: int | None = None

    def visible_para(self, autenticado: bool) -> bool:
        return self.activo and (autenticado or not self.requiere_autenticacion)


@dataclass
class MensajeContacto:
    """RF-03: mensaje enviado desde el formulario de contacto del sitio."""

    nombre: str
    correo: str
    asunto: str
    mensaje: str
    autoriza_tratamiento_datos: bool
    telefono: str = ""
    leido: bool = False
    fecha_envio: datetime = field(default_factory=_ahora)
    id: int | None = None

    def __post_init__(self):
        # Ley 1581 de 2012 (RNF-10)
        if not self.autoriza_tratamiento_datos:
            raise AutorizacionDatosRequerida()
