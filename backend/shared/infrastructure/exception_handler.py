"""Convierte las excepciones de dominio en respuestas HTTP de la API."""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from shared.domain.exceptions import DomainError, NotFoundError, PermisoDenegado


def domain_exception_handler(exc, context):
    if isinstance(exc, NotFoundError):
        return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    if isinstance(exc, PermisoDenegado):
        return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
    if isinstance(exc, DomainError):
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return exception_handler(exc, context)
