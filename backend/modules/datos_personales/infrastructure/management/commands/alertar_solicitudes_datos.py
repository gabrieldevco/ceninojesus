"""
Ley 1581: avisa a los administradores de las solicitudes de datos personales
próximas a vencer. Lo ejecuta periódicamente el servicio `workflow`.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from modules.datos_personales.infrastructure import dependencies


class Command(BaseCommand):
    help = "Alerta de solicitudes de datos personales próximas a vencer o vencidas."

    def add_arguments(self, parser):
        parser.add_argument("--dias", type=int, default=3, help="Días de anticipación de la alerta.")

    def handle(self, *args, dias, **options):
        alertadas = dependencies.alertar_por_vencer().execute(timezone.localdate(), dias)
        self.stdout.write(self.style.SUCCESS(f"Alertas por {len(alertadas)} solicitud(es) de datos personales."))
