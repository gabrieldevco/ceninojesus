from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum

from .exceptions import CalificacionInvalida, EnlaceRequerido, EntregaVacia, EntregaYaCalificada, RecursoRequerido


def _ahora():
    return datetime.now(UTC)


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


NOTA_MINIMA = Decimal("0.0")
NOTA_MAXIMA = Decimal("5.0")


@dataclass
class Entrega:
    """Trabajo que un estudiante entrega para una actividad; el docente lo califica y comenta."""

    actividad_id: int
    estudiante_usuario_id: int
    texto: str = ""
    archivo: str = ""
    url: str = ""
    fecha_entrega: datetime = field(default_factory=_ahora)
    calificacion: Decimal | None = None
    comentario_docente: str = ""
    fecha_calificacion: datetime | None = None
    estudiante_nombre: str = ""
    id: int | None = None

    @property
    def calificada(self) -> bool:
        return self.calificacion is not None

    def validar(self, archivo_nuevo: bool = False):
        if not (self.texto.strip() or self.url or self.archivo or archivo_nuevo):
            raise EntregaVacia()

    def exigir_modificable(self):
        if self.calificada:
            raise EntregaYaCalificada()

    def calificar(self, calificacion: Decimal | None, comentario: str):
        if calificacion is not None and not (NOTA_MINIMA <= calificacion <= NOTA_MAXIMA):
            raise CalificacionInvalida()
        self.calificacion = calificacion
        self.comentario_docente = comentario
        self.fecha_calificacion = _ahora()

    def tarde(self, fecha_limite: datetime | None) -> bool:
        return fecha_limite is not None and self.fecha_entrega > fecha_limite
