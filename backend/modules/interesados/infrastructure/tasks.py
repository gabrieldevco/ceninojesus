"""RF-18: recordatorio periódico de interesados sin respuesta (lo programa Celery Beat)."""

from celery import shared_task
from django.conf import settings

from . import dependencies


@shared_task(name="interesados.enviar_recordatorios")
def enviar_recordatorios(dias: int | None = None) -> int:
    vencidos = dependencies.enviar_recordatorios().execute(dias or settings.INTERESADOS_DIAS_SIN_RESPUESTA)
    return len(vencidos)
