"""
Entregas de actividades, al estilo de un aula virtual: el estudiante aprobado en el
grupo entrega su trabajo (texto, archivo o enlace) y el docente del grupo lo califica
de 0.0 a 5.0 y le deja un comentario.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from modules.contenidos.domain.entities import Actividad, Entrega
from modules.contenidos.domain.exceptions import EntregaNoEncontrada, SinArchivo
from modules.contenidos.domain.ports import AccesoGrupos, AlmacenArchivos, ContenidoRepository, EntregaRepository
from shared.domain.actor import Actor, Rol
from shared.domain.exceptions import PermisoDenegado

from .use_cases import ObtenerContenido


@dataclass
class EntregaConActividad:
    entrega: Entrega
    tarde: bool


class _CasoDeUsoEntrega:
    def __init__(
        self,
        actividades: ContenidoRepository,
        entregas: EntregaRepository,
        acceso: AccesoGrupos,
        almacen: AlmacenArchivos | None = None,
    ):
        self.actividades = actividades
        self.entregas = entregas
        self.acceso = acceso
        self.almacen = almacen
        self._ver = ObtenerContenido(actividades, acceso)

    def _actividad_visible(self, actor: Actor, grupo_id: int, actividad_id: int) -> Actividad:
        return self._ver.execute(actor, grupo_id, actividad_id)

    def _actividad_gestionable(self, actor: Actor, grupo_id: int, actividad_id: int) -> Actividad:
        if not self.acceso.puede_gestionar(actor, grupo_id):
            raise PermisoDenegado("No administra este grupo.")
        return self._ver.execute(actor, grupo_id, actividad_id)

    def _exigir_estudiante(self, actor: Actor, grupo_id: int):
        if actor.rol != Rol.ESTUDIANTE:
            raise PermisoDenegado("Solo los estudiantes entregan actividades.")

    def _entrega_de_actividad(self, actividad_id: int, entrega_id: int) -> Entrega:
        entrega = self.entregas.obtener_por_id(entrega_id)
        if entrega is None or entrega.actividad_id != actividad_id:
            raise EntregaNoEncontrada(entrega_id)
        return entrega

    @staticmethod
    def _con_estado(entrega: Entrega, actividad: Actividad) -> EntregaConActividad:
        return EntregaConActividad(entrega=entrega, tarde=entrega.tarde(actividad.fecha_entrega))


class EntregarActividad(_CasoDeUsoEntrega):
    """El estudiante entrega o reemplaza su trabajo mientras no esté calificado."""

    def execute(
        self, actor: Actor, grupo_id: int, actividad_id: int, datos: dict, archivo: Any = None
    ) -> EntregaConActividad:
        self._exigir_estudiante(actor, grupo_id)
        actividad = self._actividad_visible(actor, grupo_id, actividad_id)
        actual = self.entregas.obtener_de_estudiante(actividad_id, actor.id)
        if actual is not None:
            actual.exigir_modificable()
        entrega = Entrega(
            actividad_id=actividad_id,
            estudiante_usuario_id=actor.id,
            texto=datos.get("texto", ""),
            url=datos.get("url", ""),
            archivo=actual.archivo if actual else "",
            id=actual.id if actual else None,
        )
        entrega.validar(archivo_nuevo=archivo is not None)
        if archivo is not None:
            if entrega.archivo:
                self.almacen.eliminar(entrega.archivo)
            entrega.archivo = self.almacen.guardar(archivo, f"grupos/{grupo_id}/entregas/{actividad_id}")
        return self._con_estado(self.entregas.guardar(entrega), actividad)


class ObtenerMiEntrega(_CasoDeUsoEntrega):
    def execute(self, actor: Actor, grupo_id: int, actividad_id: int) -> EntregaConActividad | None:
        self._exigir_estudiante(actor, grupo_id)
        actividad = self._actividad_visible(actor, grupo_id, actividad_id)
        entrega = self.entregas.obtener_de_estudiante(actividad_id, actor.id)
        return self._con_estado(entrega, actividad) if entrega else None


class MisEntregasDelGrupo(_CasoDeUsoEntrega):
    """Las entregas del estudiante en todas las actividades publicadas del grupo."""

    def execute(self, actor: Actor, grupo_id: int) -> list[EntregaConActividad]:
        self._exigir_estudiante(actor, grupo_id)
        if not self.acceso.puede_ver(actor, grupo_id):
            raise PermisoDenegado("Solo los estudiantes aprobados en este grupo pueden ver su contenido.")
        actividades = {a.id: a for a in self.actividades.listar(grupo_id, solo_publicados=True)}
        entregas = self.entregas.listar_de_estudiante(actor.id, list(actividades))
        return [self._con_estado(e, actividades[e.actividad_id]) for e in entregas]


class ListarEntregas(_CasoDeUsoEntrega):
    """El docente ve todas las entregas de una actividad."""

    def execute(self, actor: Actor, grupo_id: int, actividad_id: int) -> list[EntregaConActividad]:
        actividad = self._actividad_gestionable(actor, grupo_id, actividad_id)
        return [self._con_estado(e, actividad) for e in self.entregas.listar_por_actividad(actividad_id)]


class CalificarEntrega(_CasoDeUsoEntrega):
    """El docente califica (0.0 a 5.0) y comenta; puede corregir la nota después."""

    def execute(
        self,
        actor: Actor,
        grupo_id: int,
        actividad_id: int,
        entrega_id: int,
        calificacion: Decimal | None,
        comentario: str,
    ) -> EntregaConActividad:
        actividad = self._actividad_gestionable(actor, grupo_id, actividad_id)
        entrega = self._entrega_de_actividad(actividad_id, entrega_id)
        entrega.calificar(calificacion, comentario)
        return self._con_estado(self.entregas.guardar(entrega), actividad)


class ObtenerArchivoEntrega(_CasoDeUsoEntrega):
    """Solo el docente del grupo o el propio estudiante descargan el archivo entregado."""

    def execute(self, actor: Actor, grupo_id: int, actividad_id: int, entrega_id: int) -> str:
        self._actividad_visible(actor, grupo_id, actividad_id)
        entrega = self._entrega_de_actividad(actividad_id, entrega_id)
        es_docente = self.acceso.puede_gestionar(actor, grupo_id)
        if not es_docente and entrega.estudiante_usuario_id != actor.id:
            raise PermisoDenegado("Solo el docente del grupo o quien entregó pueden ver este archivo.")
        if not entrega.archivo:
            raise SinArchivo()
        return entrega.archivo
