from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Prueba la configuración de correo saliente (SMTP o consola) enviando un mensaje de prueba."

    def add_arguments(self, parser):
        parser.add_argument(
            "destinatario",
            type=str,
            help="Dirección de correo a la que se enviará el mensaje de prueba.",
        )

    def handle(self, *args, **options):
        destinatario = options["destinatario"].strip()
        if not destinatario or "@" not in destinatario:
            raise CommandError(f"La dirección '{destinatario}' no parece válida.")

        self.stdout.write("Configuración actual:")
        self.stdout.write(f"  EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
        self.stdout.write(f"  EMAIL_HOST:    {settings.EMAIL_HOST or '(no definido)'}")
        self.stdout.write(f"  EMAIL_PORT:    {settings.EMAIL_PORT}")
        self.stdout.write(f"  EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"  EMAIL_USE_SSL: {getattr(settings, 'EMAIL_USE_SSL', False)}")
        self.stdout.write(f"  FROM:          {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write(f"\nEnviando mensaje de prueba a {destinatario}...")

        try:
            enviados = send_mail(
                subject="[CENJ] Prueba de configuración de correo",
                message=(
                    "Hola,\n\n"
                    "Este es un correo de prueba enviado desde la Plataforma Web Institucional "
                    "del Centro Educativo El Niño Jesús para verificar que el servicio SMTP saliente "
                    "está funcionando correctamente.\n\n"
                    "Si has recibido este mensaje, las notificaciones de matrículas y recordatorios "
                    "operarán sin inconvenientes."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[destinatario],
                fail_silently=False,
            )
            if enviados > 0:
                self.stdout.write(self.style.SUCCESS(f"✔ Mensaje enviado exitosamente a {destinatario}."))
            else:
                self.stdout.write(self.style.WARNING("No se envió ningún mensaje."))
        except Exception as error:
            self.stdout.write(self.style.ERROR(f"✖ Error al enviar correo: {error}"))
            raise CommandError(f"Fallo en la prueba de correo: {error}") from error
