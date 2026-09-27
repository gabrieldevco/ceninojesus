"""Convierte las excepciones de dominio en respuestas HTTP de la API."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from shared.domain.exceptions import DomainError, NotFoundError


def domain_exception_handler(exc, context):
    if isinstance(exc, NotFoundError):
        return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    if isinstance(exc, DomainError):
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return exception_handler(exc, context)
