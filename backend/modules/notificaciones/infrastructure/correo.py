"""Adaptador del puerto EnviadorCorreo con el sistema de correo de Django."""

import logging

from django.conf import settings
from django.core.mail import send_mail

from shared.domain.notificaciones import EnviadorCorreo

logger = logging.getLogger(__name__)


class DjangoEnviadorCorreo(EnviadorCorreo):
    def enviar(self, destinatarios: list[str], asunto: str, mensaje: str) -> None:
        destinatarios = [d for d in destinatarios if d]
        if not destinatarios:
            return
        try:
            send_mail(asunto, mensaje, settings.DEFAULT_FROM_EMAIL, destinatarios)
        except Exception:
            # Un fallo del correo no debe impedir la operación
            logger.exception("No se pudo enviar el correo: %s", asunto)
