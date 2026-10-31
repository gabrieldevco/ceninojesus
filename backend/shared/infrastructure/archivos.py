"""Validación de archivos subidos: tipo permitido, tamaño máximo y firma real del contenido."""

import os

from django.conf import settings
from rest_framework import serializers

# extensión -> firmas (bytes iniciales) válidas; None = sin firma fija (texto, contenedores variables)
TIPOS_PERMITIDOS: dict[str, tuple[bytes, ...] | None] = {
    ".pdf": (b"%PDF-",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".docx": (b"PK\x03\x04",),
    ".pptx": (b"PK\x03\x04",),
    ".xlsx": (b"PK\x03\x04",),
    ".zip": (b"PK\x03\x04",),
    ".doc": (b"\xd0\xcf\x11\xe0",),
    ".ppt": (b"\xd0\xcf\x11\xe0",),
    ".xls": (b"\xd0\xcf\x11\xe0",),
    ".mp4": None,
    ".txt": None,
}


def validar_archivo_permitido(archivo):
    extension = os.path.splitext(archivo.name)[1].lower()
    if extension not in TIPOS_PERMITIDOS:
        permitidos = ", ".join(sorted(TIPOS_PERMITIDOS))
        raise serializers.ValidationError(f"Tipo de archivo no permitido. Use: {permitidos}.")

    maximo = settings.ARCHIVO_MAX_MB * 1024 * 1024
    if archivo.size > maximo:
        raise serializers.ValidationError(f"El archivo supera el máximo de {settings.ARCHIVO_MAX_MB} MB.")

    firmas = TIPOS_PERMITIDOS[extension]
    if firmas:
        inicio = archivo.read(16)
        archivo.seek(0)
        if not inicio.startswith(firmas):
            raise serializers.ValidationError("El contenido del archivo no corresponde a su extensión.")
    return archivo


TIPOS_IMAGEN = (".jpg", ".jpeg", ".png")


def validar_imagen(archivo):
    """Solo imágenes JPG o PNG: se sirven públicamente, así que no se admite nada más."""
    extension = os.path.splitext(archivo.name)[1].lower()
    if extension not in TIPOS_IMAGEN:
        raise serializers.ValidationError("La imagen debe ser JPG o PNG.")
    return validar_archivo_permitido(archivo)
