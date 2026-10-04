"""Quién ejecuta un caso de uso: los casos de uso reciben un Actor, nunca un request."""

from dataclasses import dataclass
from enum import StrEnum


class Rol(StrEnum):
    ADMINISTRADOR = "administrador"
    ADMINISTRADOR_GRUPO = "administrador_grupo"
    ACUDIENTE = "acudiente"
    ESTUDIANTE = "estudiante"


@dataclass(frozen=True)
class Actor:
    id: int
    rol: Rol

    @property
    def es_administrador(self):
        return self.rol == Rol.ADMINISTRADOR
