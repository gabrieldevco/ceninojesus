"""Utilidades para los tests de API (requieren Django)."""

from django.contrib.auth import get_user_model

from shared.domain.actor import Rol


def crear_usuario(nombre_usuario, rol=Rol.ACUDIENTE, **extra):
    return get_user_model().objects.create_user(
        nombre_usuario, f"{nombre_usuario}@example.com", "clave-segura-123", rol=rol, **extra
    )
