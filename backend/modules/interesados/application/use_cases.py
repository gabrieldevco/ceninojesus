"""
Casos de uso del módulo de interesados.

Orquestan el dominio a través de los puertos; no conocen Django.
"""

from dataclasses import dataclass
from datetime import datetime, timezone

from modules.interesados.domain.entities import EstadoInteresado, Interesado, Seguimiento
from modules.interesados.domain.exceptions import InteresadoNoEncontrado
from modules.interesados.domain.ports import InteresadoRepository, RecordatorioRepository, SeguimientoRepository
from shared.domain.actor import Actor
from shared.domain.notificaciones import Notificador


@dataclass(frozen=True)
class RegistrarInteresadoCommand:
    nombre_completo: str
    correo: str
    telefono: str
    autoriza_tratamiento_datos: bool
    mensaje: str = ""
    nombre_aspirante: str = ""
    grado_interes: str = ""


def _obtener(repository: InteresadoRepository, interesado_id: int) -> Interesado:
    interesado = repository.obtener_por_id(interesado_id)
    if interesado is None:
        raise InteresadoNoEncontrado(interesado_id)
    return interesado


class RegistrarInteresado:
    """RF-16 / RF-17: registrar a un interesado en la matrícula general y avisar a los administradores."""

    def __init__(self, repository: InteresadoRepository, notificador: Notificador):
        self.repository = repository
        self.notificador = notificador

    def execute(self, command: RegistrarInteresadoCommand) -> Interesado:
        interesado = self.repository.guardar(Interesado(**command.__dict__))
        self.notificador.notificar_administradores(
            "Nuevo interesado en matrícula",
            f"{interesado.nombre_completo} ({interesado.correo}, {interesado.telefono}) "
            "diligenció el formulario de interés. Recuerde darle respuesta.",
        )
        return interesado


class CambiarEstadoInteresado:
    """RF-19: actualizar el estado de seguimiento de un interesado."""

    def __init__(self, repository: InteresadoRepository):
        self.repository = repository

    def execute(self, interesado_id: int, nuevo_estado: EstadoInteresado) -> Interesado:
        interesado = _obtener(self.repository, interesado_id)
        interesado.cambiar_estado(nuevo_estado)
        return self.repository.guardar(interesado)


class ListarInteresados:
    def __init__(self, repository: InteresadoRepository):
        self.repository = repository

    def execute(self, estado: EstadoInteresado | None = None) -> list[Interesado]:
        return self.repository.listar(estado)


class RegistrarSeguimiento:
    """Anota un contacto con el interesado; reinicia el plazo de los recordatorios (RF-18)."""

    def __init__(self, repository: InteresadoRepository, seguimientos: SeguimientoRepository):
        self.repository = repository
        self.seguimientos = seguimientos

    def execute(self, actor: Actor, interesado_id: int, nota: str) -> Seguimiento:
        interesado = _obtener(self.repository, interesado_id)
        interesado.registrar_contacto()
        self.repository.guardar(interesado)
        return self.seguimientos.guardar(Seguimiento(interesado_id=interesado_id, usuario_id=actor.id, nota=nota))


class ListarSeguimientos:
    def __init__(self, repository: InteresadoRepository, seguimientos: SeguimientoRepository):
        self.repository = repository
        self.seguimientos = seguimientos

    def execute(self, interesado_id: int) -> list[Seguimiento]:
        _obtener(self.repository, interesado_id)
        return self.seguimientos.listar(interesado_id)


class AnonimizarInteresado:
    """Ley 1581, derecho de supresión."""

    def __init__(self, repository: InteresadoRepository, seguimientos: SeguimientoRepository):
        self.repository = repository
        self.seguimientos = seguimientos

    def execute(self, interesado_id: int) -> Interesado:
        interesado = _obtener(self.repository, interesado_id)
        interesado.anonimizar()
        self.seguimientos.eliminar_de(interesado_id)
        return self.repository.guardar(interesado)


class EnviarRecordatoriosSeguimiento:
    """
    RF-18: workflow automático. Avisa a los administradores de los interesados
    que llevan `dias` días sin respuesta. Se ejecuta periódicamente
    (comando `enviar_recordatorios_interesados`).
    """

    def __init__(
        self,
        repository: InteresadoRepository,
        recordatorios: RecordatorioRepository,
        notificador: Notificador,
    ):
        self.repository = repository
        self.recordatorios = recordatorios
        self.notificador = notificador

    def execute(self, dias: int, ahora: datetime | None = None) -> list[Interesado]:
        ahora = ahora or datetime.now(timezone.utc)
        pendientes = self.repository.listar_pendientes()
        ultimos = self.recordatorios.ultimos([i.id for i in pendientes])
        vencidos = [i for i in pendientes if i.requiere_recordatorio(ahora, dias, ultimos.get(i.id))]
        if not vencidos:
            return []

        lineas = "\n".join(f"- {i.nombre_completo} ({i.correo}, {i.telefono}) — estado: {i.estado}" for i in vencidos)
        self.notificador.notificar_administradores(
            f"{len(vencidos)} interesado(s) sin respuesta",
            f"Estos interesados llevan {dias} día(s) o más sin respuesta:\n\n{lineas}",
        )
        self.recordatorios.registrar([i.id for i in vencidos], ahora)
        return vencidos
