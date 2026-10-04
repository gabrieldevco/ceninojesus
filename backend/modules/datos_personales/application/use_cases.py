"""Atención de los derechos de los titulares (Ley 1581 de 2012, RNF-10)."""

from dataclasses import dataclass
from datetime import date

from modules.datos_personales.domain.entities import EstadoSolicitudDatos, SolicitudDatos, TipoSolicitudDatos
from modules.datos_personales.domain.exceptions import SolicitudDatosNoEncontrada
from modules.datos_personales.domain.ports import SolicitudDatosRepository
from shared.domain.actor import Actor
from shared.domain.notificaciones import EnviadorCorreo, Notificador

TIPOS_LEGIBLES = {
    TipoSolicitudDatos.CONSULTA: "consulta",
    TipoSolicitudDatos.ACTUALIZACION: "actualización",
    TipoSolicitudDatos.RECTIFICACION: "rectificación",
    TipoSolicitudDatos.SUPRESION: "supresión",
    TipoSolicitudDatos.REVOCATORIA: "revocatoria de la autorización",
}


@dataclass(frozen=True)
class DatosSolicitud:
    nombre: str
    correo: str
    tipo: TipoSolicitudDatos
    descripcion: str
    documento_identidad: str = ""


class RadicarSolicitudDatos:
    """Registra la solicitud, envía el acuse al titular y avisa a los administradores."""

    def __init__(self, repository: SolicitudDatosRepository, notificador: Notificador, correo: EnviadorCorreo):
        self.repository = repository
        self.notificador = notificador
        self.correo = correo

    def execute(self, datos: DatosSolicitud, usuario_id: int | None = None) -> SolicitudDatos:
        solicitud = self.repository.guardar(SolicitudDatos(**datos.__dict__, usuario_id=usuario_id))
        tipo = TIPOS_LEGIBLES[solicitud.tipo]
        limite = solicitud.fecha_limite.strftime("%d/%m/%Y")
        self.correo.enviar(
            [solicitud.correo],
            f"Radicado No. {solicitud.id} - Solicitud de {tipo} de datos personales",
            f"Hola {solicitud.nombre}:\n\n"
            f"Recibimos su solicitud de {tipo} con el radicado No. {solicitud.id}. "
            f"Le daremos respuesta a más tardar el {limite}, según la Ley 1581 de 2012.\n\n"
            "Centro Educativo El Niño Jesús",
        )
        self.notificador.notificar_administradores(
            f"Solicitud de {tipo} de datos personales (radicado {solicitud.id})",
            f"{solicitud.nombre} ({solicitud.correo}) escribió:\n\n{solicitud.descripcion}\n\n"
            f"Plazo legal de respuesta: {limite}.",
        )
        return solicitud


def _obtener(repository: SolicitudDatosRepository, solicitud_id: int) -> SolicitudDatos:
    solicitud = repository.obtener_por_id(solicitud_id)
    if solicitud is None:
        raise SolicitudDatosNoEncontrada(solicitud_id)
    return solicitud


class ListarSolicitudesDatos:
    def __init__(self, repository: SolicitudDatosRepository):
        self.repository = repository

    def execute(self, estado: EstadoSolicitudDatos | None = None) -> list[SolicitudDatos]:
        return self.repository.listar(estado)


class TramitarSolicitudDatos:
    def __init__(self, repository: SolicitudDatosRepository):
        self.repository = repository

    def execute(self, actor: Actor, solicitud_id: int) -> SolicitudDatos:
        solicitud = _obtener(self.repository, solicitud_id)
        solicitud.tramitar(actor)
        return self.repository.guardar(solicitud)


class ResponderSolicitudDatos:
    """Guarda la respuesta y se la envía al titular por correo."""

    def __init__(self, repository: SolicitudDatosRepository, correo: EnviadorCorreo):
        self.repository = repository
        self.correo = correo

    def execute(self, actor: Actor, solicitud_id: int, respuesta: str) -> SolicitudDatos:
        solicitud = _obtener(self.repository, solicitud_id)
        solicitud.responder(actor, respuesta)
        solicitud = self.repository.guardar(solicitud)
        self.correo.enviar(
            [solicitud.correo],
            f"Respuesta al radicado No. {solicitud.id} - Datos personales",
            f"Hola {solicitud.nombre}:\n\n{respuesta}\n\nCentro Educativo El Niño Jesús",
        )
        return solicitud


class AlertarSolicitudesPorVencer:
    """Avisa a los administradores, una vez al día, de las solicitudes próximas a vencer o vencidas."""

    def __init__(self, repository: SolicitudDatosRepository, notificador: Notificador):
        self.repository = repository
        self.notificador = notificador

    def execute(self, hoy: date, dias_anticipacion: int = 3) -> list[SolicitudDatos]:
        por_vencer = [s for s in self.repository.listar_sin_resolver() if s.requiere_alerta(hoy, dias_anticipacion)]
        if not por_vencer:
            return []
        lineas = "\n".join(
            f"- Radicado {s.id}: {TIPOS_LEGIBLES[s.tipo]} de {s.nombre}, vence el {s.fecha_limite:%d/%m/%Y}"
            for s in por_vencer
        )
        self.notificador.notificar_administradores(
            f"{len(por_vencer)} solicitud(es) de datos personales por vencer",
            f"Estas solicitudes deben responderse dentro del plazo legal:\n\n{lineas}",
        )
        for solicitud in por_vencer:
            solicitud.fecha_ultima_alerta = hoy
            self.repository.guardar(solicitud)
        return por_vencer
