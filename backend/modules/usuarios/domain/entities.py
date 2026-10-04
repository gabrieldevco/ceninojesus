from dataclasses import dataclass
from datetime import date, datetime

from shared.domain.actor import Actor, Rol

from .exceptions import EstudianteYaTieneAcceso


@dataclass
class Usuario:
    nombre_usuario: str
    rol: Rol
    correo: str = ""
    nombres: str = ""
    apellidos: str = ""
    telefono: str = ""
    activo: bool = True
    # Prueba de la autorización de tratamiento de datos (Ley 1581 de 2012, RNF-10)
    fecha_autorizacion_datos: datetime | None = None
    id: int | None = None

    def anonimizar(self):
        """Supresión de datos personales: conserva el registro para la trazabilidad, sin datos que identifiquen."""
        self.nombre_usuario = f"anonimo-{self.id}"
        self.correo = ""
        self.nombres = ""
        self.apellidos = ""
        self.telefono = ""
        self.activo = False


@dataclass
class Estudiante:
    """Hijo o acudido de un acudiente. Puede tener o no usuario para ingresar (RF-06)."""

    nombres: str
    apellidos: str
    acudiente_id: int
    documento_identidad: str = ""
    fecha_nacimiento: date | None = None
    grado: str = ""
    usuario_id: int | None = None
    # Autorización dada por el acudiente en representación del menor (Decreto 1377 de 2013, art. 12)
    fecha_autorizacion_datos: datetime | None = None
    id: int | None = None

    def puede_ser_gestionado_por(self, actor: Actor) -> bool:
        return actor.es_administrador or actor.id == self.acudiente_id

    def asignar_acceso(self, usuario_id: int):
        if self.usuario_id is not None:
            raise EstudianteYaTieneAcceso()
        self.usuario_id = usuario_id

    def anonimizar(self):
        self.nombres = "Estudiante"
        self.apellidos = "anonimizado"
        self.documento_identidad = ""
        self.fecha_nacimiento = None
        self.grado = ""
