from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum

from .exceptions import EnlaceRequerido, RecursoRequerido


def _ahora():
    return datetime.now(timezone.utc)


@dataclass
class Contenido:
    """Base común del contenido que el administrador de un grupo publica (tipo LMS)."""

    grupo_id: int
    titulo: str
    autor_id: int
    descripcion: str = ""
    archivo: str = ""
    url: str = ""
    publicado: bool = True
    fecha_publicacion: datetime = field(default_factory=_ahora)
    id: int | None = None

    def validar(self, archivo_nuevo: bool = False):
        """Se llama antes de guardar. `archivo_nuevo` indica que llega un archivo en esta operación."""


class TipoMaterial(StrEnum):
    DOCUMENTO = "documento"
    VIDEO = "video"
    ENLACE = "enlace"


@dataclass
class MaterialApoyo(Contenido):
    """RF-12: documentos, videos o enlaces de apoyo."""

    tipo: TipoMaterial = TipoMaterial.DOCUMENTO

    def validar(self, archivo_nuevo: bool = False):
        tiene_archivo = archivo_nuevo or bool(self.archivo)
        if self.tipo == TipoMaterial.ENLACE and not self.url:
            raise EnlaceRequerido()
        if not (tiene_archivo or self.url):
            raise RecursoRequerido()


@dataclass
class Actividad(Contenido):
    """RF-13: actividad dirigida a los estudiantes inscritos; el archivo o enlace es opcional."""

    fecha_entrega: datetime | None = None
