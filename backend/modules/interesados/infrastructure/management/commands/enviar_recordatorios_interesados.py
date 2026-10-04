"""
RF-18: recordatorios automáticos de interesados sin respuesta.

Se ejecuta periódicamente (en Docker lo hace el servicio `workflow`):
    python manage.py enviar_recordatorios_interesados
"""

from django.conf import settings
from django.core.management.base import BaseCommand

from modules.interesados.infrastructure import dependencies


class Command(BaseCommand):
    help = "Avisa a los administradores de los interesados que no han recibido respuesta."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dias",
            type=int,
            default=settings.INTERESADOS_DIAS_SIN_RESPUESTA,
            help="Días sin respuesta para generar el recordatorio.",
        )

    def handle(self, *args, dias, **options):
        vencidos = dependencies.enviar_recordatorios().execute(dias)
        self.stdout.write(self.style.SUCCESS(f"Recordatorios enviados por {len(vencidos)} interesado(s)."))
