"""Casos de uso del sitio institucional (RF-01 a RF-05)."""

from dataclasses import dataclass, replace

from modules.institucional.domain.entities import (
    ElementoLanding,
    EnlacePortal,
    InformacionInstitucional,
    MensajeContacto,
    SeccionLanding,
    TipoEnlace,
)
from modules.institucional.domain.exceptions import (
    ElementoNoEncontrado,
    ElementoSinImagen,
    EnlaceNoEncontrado,
    MensajeNoEncontrado,
)
from modules.institucional.domain.ports import (
    ElementoLandingRepository,
    EnlaceRepository,
    InformacionRepository,
    MensajeContactoRepository,
)
from shared.domain.notificaciones import Notificador


class ObtenerInformacion:
    def __init__(self, repository: InformacionRepository):
        self.repository = repository

    def execute(self) -> InformacionInstitucional:
        return self.repository.obtener() or InformacionInstitucional()


class ActualizarInformacion:
    def __init__(self, repository: InformacionRepository):
        self.repository = repository

    def execute(self, cambios: dict) -> InformacionInstitucional:
        actual = ObtenerInformacion(self.repository).execute()
        return self.repository.guardar(replace(actual, **cambios))


class ListarEnlaces:
    def __init__(self, repository: EnlaceRepository):
        self.repository = repository

    def execute(self, autenticado: bool, incluir_inactivos: bool = False) -> list[EnlacePortal]:
        enlaces = self.repository.listar()
        if incluir_inactivos:
            return enlaces
        # RF-06: los enlaces a áreas restringidas solo se muestran a usuarios autenticados
        return [enlace for enlace in enlaces if enlace.visible_para(autenticado)]


@dataclass(frozen=True)
class DatosEnlace:
    nombre: str
    url: str
    tipo: TipoEnlace
    descripcion: str = ""
    requiere_autenticacion: bool = False
    orden: int = 0
    activo: bool = True


class CrearEnlace:
    def __init__(self, repository: EnlaceRepository):
        self.repository = repository

    def execute(self, datos: DatosEnlace) -> EnlacePortal:
        return self.repository.guardar(EnlacePortal(**datos.__dict__))


class ActualizarEnlace:
    def __init__(self, repository: EnlaceRepository):
        self.repository = repository

    def execute(self, enlace_id: int, cambios: dict) -> EnlacePortal:
        enlace = self.repository.obtener_por_id(enlace_id)
        if enlace is None:
            raise EnlaceNoEncontrado(enlace_id)
        return self.repository.guardar(replace(enlace, **cambios))


class EliminarEnlace:
    def __init__(self, repository: EnlaceRepository):
        self.repository = repository

    def execute(self, enlace_id: int) -> None:
        if self.repository.obtener_por_id(enlace_id) is None:
            raise EnlaceNoEncontrado(enlace_id)
        self.repository.eliminar(enlace_id)


@dataclass(frozen=True)
class DatosMensaje:
    nombre: str
    correo: str
    asunto: str
    mensaje: str
    autoriza_tratamiento_datos: bool
    telefono: str = ""


class EnviarMensajeContacto:
    """RF-03: guarda el mensaje y avisa a los administradores."""

    def __init__(self, repository: MensajeContactoRepository, notificador: Notificador):
        self.repository = repository
        self.notificador = notificador

    def execute(self, datos: DatosMensaje) -> MensajeContacto:
        mensaje = self.repository.guardar(MensajeContacto(**datos.__dict__))
        self.notificador.notificar_administradores(
            f"Nuevo mensaje de contacto: {mensaje.asunto}",
            f"{mensaje.nombre} ({mensaje.correo}) escribió:\n\n{mensaje.mensaje}",
        )
        return mensaje


class ListarMensajes:
    def __init__(self, repository: MensajeContactoRepository):
        self.repository = repository

    def execute(self, solo_no_leidos: bool = False) -> list[MensajeContacto]:
        return self.repository.listar(solo_no_leidos)


class MarcarMensajeLeido:
    def __init__(self, repository: MensajeContactoRepository):
        self.repository = repository

    def execute(self, mensaje_id: int) -> MensajeContacto:
        mensaje = self.repository.obtener_por_id(mensaje_id)
        if mensaje is None:
            raise MensajeNoEncontrado(mensaje_id)
        mensaje.leido = True
        return self.repository.guardar(mensaje)


# --- Contenido de la página de inicio ---


@dataclass(frozen=True)
class DatosElemento:
    seccion: SeccionLanding
    titulo: str = ""
    texto: str = ""
    detalle: str = ""
    icono: str = ""
    orden: int = 0
    activo: bool = True


def _obtener_elemento(repository: ElementoLandingRepository, elemento_id: int) -> ElementoLanding:
    elemento = repository.obtener_por_id(elemento_id)
    if elemento is None:
        raise ElementoNoEncontrado(elemento_id)
    return elemento


class ListarElementos:
    """Lectura pública: solo los elementos activos. El administrador puede pedir también los ocultos."""

    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, seccion: SeccionLanding | None = None, incluir_inactivos: bool = False) -> list[ElementoLanding]:
        elementos = self.repository.listar(seccion)
        return elementos if incluir_inactivos else [e for e in elementos if e.activo]


class CrearElemento:
    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, datos: DatosElemento) -> ElementoLanding:
        elemento = ElementoLanding(**datos.__dict__)
        if elemento.es_de_imagen_unica:
            # Una sección de imagen única nunca tiene más de un elemento
            existente = self.repository.obtener_unico(elemento.seccion)
            if existente is not None:
                return existente
        return self.repository.guardar(elemento)


class ActualizarElemento:
    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, elemento_id: int, cambios: dict) -> ElementoLanding:
        elemento = _obtener_elemento(self.repository, elemento_id)
        # La sección no se cambia: un valor no puede volverse una imagen de portada
        return self.repository.guardar(replace(elemento, **{k: v for k, v in cambios.items() if k != "seccion"}))


class EliminarElemento:
    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, elemento_id: int) -> None:
        _obtener_elemento(self.repository, elemento_id)
        self.repository.eliminar(elemento_id)


class SubirImagenElemento:
    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, elemento_id: int, archivo) -> ElementoLanding:
        _obtener_elemento(self.repository, elemento_id)
        return self.repository.guardar_imagen(elemento_id, archivo)


class ReemplazarImagenUnica:
    """Cambia la imagen de la portada, de "quiénes somos" o del enfoque; crea el elemento si aún no existe."""

    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, seccion: SeccionLanding, archivo) -> ElementoLanding:
        elemento = self.repository.obtener_unico(seccion) or self.repository.guardar(ElementoLanding(seccion=seccion))
        return self.repository.guardar_imagen(elemento.id, archivo)


class QuitarImagenElemento:
    """Quita la imagen subida: el elemento vuelve a mostrar la imagen incluida con el sitio, si la tiene."""

    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, elemento_id: int) -> ElementoLanding:
        _obtener_elemento(self.repository, elemento_id)
        return self.repository.quitar_imagen(elemento_id)


class ObtenerRutaImagen:
    """Ruta de la imagen subida de un elemento visible (o de cualquiera, para el administrador)."""

    def __init__(self, repository: ElementoLandingRepository):
        self.repository = repository

    def execute(self, elemento_id: int, es_administrador: bool = False) -> str:
        elemento = _obtener_elemento(self.repository, elemento_id)
        ruta = self.repository.ruta_imagen(elemento_id)
        if ruta is None or not (elemento.activo or es_administrador):
            raise ElementoSinImagen()
        return ruta
