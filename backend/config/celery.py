"""Aplicación Celery: tareas en segundo plano (correos, recordatorios, alertas)."""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("ceninojesus")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks(
    [
        "modules.notificaciones.infrastructure",
        "modules.interesados.infrastructure",
        "modules.datos_personales.infrastructure",
    ]
)
