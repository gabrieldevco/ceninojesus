"""Casos de uso del sitio institucional (RF-01 a RF-05)."""

from dataclasses import dataclass, replace

from modules.institucional.domain.entities import EnlacePortal, InformacionInstitucional, MensajeContacto, TipoEnlace
from modules.institucional.domain.exceptions import EnlaceNoEncontrado, MensajeNoEncontrado
from modules.institucional.domain.ports import EnlaceRepository, InformacionRepository, MensajeContactoRepository
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
