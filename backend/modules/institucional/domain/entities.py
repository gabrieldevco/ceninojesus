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
    # Portada y secciones de la página de inicio (editables por la institución)
    portada_etiqueta: str = ""
    portada_titulo: str = ""
    portada_destacado: str = ""
    portada_texto: str = ""
    quienes_principal: str = ""
    quienes_secundario: str = ""
    enfoque_titulo: str = ""
    enfoque_texto: str = ""
    # Pasos separados por comas: "Explorar, Preguntar, Construir"
    enfoque_pasos: str = ""
    enfoque_nota: str = ""
    # Mientras sea True, el inicio avisa que historia, misión y visión aún no son las oficiales
    horizonte_pendiente_validacion: bool = True
    contacto_titulo: str = ""
    contacto_texto: str = ""
    pie_descripcion: str = ""


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


class SeccionLanding(StrEnum):
    """Bloques repetibles de la página de inicio."""

    DATO_DESTACADO = "dato_destacado"  # franja de cifras: titulo = cifra, texto = descripción
    VALOR = "valor"  # titulo, texto, icono (emoji)
    OFERTA = "oferta"  # titulo, texto, icono (clave del ícono)
    DIRECTIVO = "directivo"  # titulo = nombre, texto = cargo, detalle = correo
    GALERIA = "galeria"  # titulo = pie de foto, texto = descripción de la imagen
    # Imágenes únicas: solo existe un elemento por sección
    IMAGEN_PORTADA = "imagen_portada"
    IMAGEN_QUIENES = "imagen_quienes"
    IMAGEN_ENFOQUE = "imagen_enfoque"


SECCIONES_DE_IMAGEN_UNICA = frozenset(
    {SeccionLanding.IMAGEN_PORTADA, SeccionLanding.IMAGEN_QUIENES, SeccionLanding.IMAGEN_ENFOQUE}
)


@dataclass
class ElementoLanding:
    """Un elemento de lista (o una imagen) de la página de inicio."""

    seccion: SeccionLanding
    titulo: str = ""
    texto: str = ""
    detalle: str = ""
    icono: str = ""
    # Ruta de una imagen incluida con el sitio; se usa mientras no se suba otra
    imagen_estatica: str = ""
    tiene_imagen_subida: bool = False
    orden: int = 0
    activo: bool = True
    actualizado: datetime | None = None
    id: int | None = None

    @property
    def es_de_imagen_unica(self) -> bool:
        return self.seccion in SECCIONES_DE_IMAGEN_UNICA
