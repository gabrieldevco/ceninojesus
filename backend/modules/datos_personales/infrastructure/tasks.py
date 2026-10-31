"""Ley 1581: alerta periódica de solicitudes de datos personales por vencer (la programa Celery Beat)."""

from celery import shared_task
from django.utils import timezone

from . import dependencies


@shared_task(name="datos_personales.alertar_por_vencer")
def alertar_por_vencer(dias: int = 3) -> int:
    alertadas = dependencies.alertar_por_vencer().execute(timezone.localdate(), dias)
    return len(alertadas)
