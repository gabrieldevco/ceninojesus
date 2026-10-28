"""Tarea de Celery que envía los correos fuera del ciclo de la petición."""

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(
    name="notificaciones.enviar_correo",
    autoretry_for=(OSError,),
    retry_backoff=True,
    retry_backoff_max=900,
    max_retries=5,
)
def enviar_correo(destinatarios: list[str], asunto: str, mensaje: str) -> None:
    """Un fallo de red (SMTP) se reintenta con espera exponencial; otros errores se registran."""
    try:
        send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, destinatarios)
    except OSError:
        raise
    except Exception:
        logger.exception("No se pudo enviar el correo: %s", asunto)
