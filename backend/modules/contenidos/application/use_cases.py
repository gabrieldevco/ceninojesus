"""
Casos de uso del contenido por grupo (RF-12 a RF-15).

Son genéricos: la misma lógica sirve para materiales y actividades; cambia
el repositorio y la clase de entidad que se inyectan.
"""

from dataclasses import replace
from typing import Any

from modules.contenidos.domain.entities import Contenido
from modules.contenidos.domain.exceptions import ContenidoNoEncontrado, SinArchivo
from modules.contenidos.domain.ports import AccesoGrupos, AlmacenArchivos, ContenidoRepository
from shared.domain.actor import Actor
from shared.domain.exceptions import PermisoDenegado

MENSAJE_SIN_ACCESO = "Solo los estudiantes aprobados en este grupo pueden ver su contenido."


class _CasoDeUsoContenido:
    def __init__(self, repository: ContenidoRepository, acceso: AccesoGrupos, almacen: AlmacenArchivos | None = None):
        self.repository = repository
        self.acceso = acceso
        self.almacen = almacen

    def _exigir_gestion(self, actor: Actor, grupo_id: int):
        if not self.acceso.puede_gestionar(actor, grupo_id):
            raise PermisoDenegado("No administra este grupo.")

    def _obtener(self, grupo_id: int, contenido_id: int) -> Contenido:
        contenido = self.repository.obtener_por_id(contenido_id)
        if contenido is None or contenido.grupo_id != grupo_id:
            raise ContenidoNoEncontrado(contenido_id)
        return contenido

    def _obtener_visible(self, actor: Actor, grupo_id: int, contenido_id: int) -> Contenido:
        contenido = self._obtener(grupo_id, contenido_id)
        if self.acceso.puede_gestionar(actor, grupo_id):
            return contenido
        if not self.acceso.puede_ver(actor, grupo_id):
            raise PermisoDenegado(MENSAJE_SIN_ACCESO)
        if not contenido.publicado:
            raise ContenidoNoEncontrado(contenido_id)
        return contenido


class ListarContenidos(_CasoDeUsoContenido):
    """RF-14 / RF-15: el administrador ve todo; el estudiante aprobado, solo lo publicado."""

    def execute(self, actor: Actor, grupo_id: int) -> list[Contenido]:
        if self.acceso.puede_gestionar(actor, grupo_id):
            return self.repository.listar(grupo_id)
        if self.acceso.puede_ver(actor, grupo_id):
            return self.repository.listar(grupo_id, solo_publicados=True)
        raise PermisoDenegado(MENSAJE_SIN_ACCESO)


class ObtenerContenido(_CasoDeUsoContenido):
    def execute(self, actor: Actor, grupo_id: int, contenido_id: int) -> Contenido:
        return self._obtener_visible(actor, grupo_id, contenido_id)


class ObtenerArchivoContenido(_CasoDeUsoContenido):
    """Devuelve la ruta del archivo solo si el actor puede ver el contenido (RF-14)."""

    def execute(self, actor: Actor, grupo_id: int, contenido_id: int) -> str:
        contenido = self._obtener_visible(actor, grupo_id, contenido_id)
        if not contenido.archivo:
            raise SinArchivo()
        return contenido.archivo


class CrearContenido(_CasoDeUsoContenido):
    """RF-12 / RF-13."""

    def __init__(self, repository, acceso, almacen, entidad: type[Contenido]):
        super().__init__(repository, acceso, almacen)
        self.entidad = entidad

    def execute(self, actor: Actor, grupo_id: int, datos: dict, archivo: Any = None) -> Contenido:
        self._exigir_gestion(actor, grupo_id)
        contenido = self.entidad(grupo_id=grupo_id, autor_id=actor.id, **datos)
        contenido.validar(archivo_nuevo=archivo is not None)
        if archivo is not None:
            contenido.archivo = self.almacen.guardar(archivo, f"grupos/{grupo_id}")
        return self.repository.guardar(contenido)


class ActualizarContenido(_CasoDeUsoContenido):
    def execute(
        self, actor: Actor, grupo_id: int, contenido_id: int, cambios: dict, archivo: Any = None
    ) -> Contenido:
        self._exigir_gestion(actor, grupo_id)
        actual = self._obtener(grupo_id, contenido_id)
        contenido = replace(actual, **cambios)
        contenido.validar(archivo_nuevo=archivo is not None)
        if archivo is not None:
            if actual.archivo:
                self.almacen.eliminar(actual.archivo)
            contenido.archivo = self.almacen.guardar(archivo, f"grupos/{grupo_id}")
        return self.repository.guardar(contenido)


class EliminarContenido(_CasoDeUsoContenido):
    def execute(self, actor: Actor, grupo_id: int, contenido_id: int) -> None:
        self._exigir_gestion(actor, grupo_id)
        contenido = self._obtener(grupo_id, contenido_id)
        if contenido.archivo:
            self.almacen.eliminar(contenido.archivo)
        self.repository.eliminar(contenido_id)
