"""
Composición del módulo. Cada caso de uso se construye para un tipo de
contenido: "materiales" o "actividades".
"""

from modules.contenidos.application import use_cases
from modules.contenidos.domain.entities import Actividad, MaterialApoyo

from .acceso import AccesoGruposAdapter
from .repositories import DjangoActividadRepository, DjangoAlmacenArchivos, DjangoMaterialRepository

TIPOS = {
    "materiales": (DjangoMaterialRepository, MaterialApoyo),
    "actividades": (DjangoActividadRepository, Actividad),
}


def _args(tipo):
    repository_class, _ = TIPOS[tipo]
    return repository_class(), AccesoGruposAdapter(), DjangoAlmacenArchivos()


def listar(tipo):
    return use_cases.ListarContenidos(*_args(tipo))


def obtener(tipo):
    return use_cases.ObtenerContenido(*_args(tipo))


def obtener_archivo(tipo):
    return use_cases.ObtenerArchivoContenido(*_args(tipo))


def crear(tipo):
    return use_cases.CrearContenido(*_args(tipo), entidad=TIPOS[tipo][1])


def actualizar(tipo):
    return use_cases.ActualizarContenido(*_args(tipo))


def eliminar(tipo):
    return use_cases.EliminarContenido(*_args(tipo))
