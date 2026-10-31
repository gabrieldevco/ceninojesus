"""Adaptador del puerto EnviadorCorreo: encola el envío en Celery."""

import logging

from shared.domain.notificaciones import EnviadorCorreo

from .tasks import enviar_correo

logger = logging.getLogger(__name__)


class DjangoEnviadorCorreo(EnviadorCorreo):
    def enviar(self, destinatarios: list[str], asunto: str, mensaje: str) -> None:
        destinatarios = [d for d in destinatarios if d]
        if not destinatarios:
            return
        try:
            enviar_correo.delay(destinatarios, asunto, mensaje)
        except Exception:
            # Si la cola no responde, la operación del usuario no debe fallar
            logger.exception("No se pudo encolar el correo: %s", asunto)
