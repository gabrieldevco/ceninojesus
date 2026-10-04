from django.conf import settings
from django.db import models

from modules.datos_personales.domain.entities import EstadoSolicitudDatos, TipoSolicitudDatos


class SolicitudDatosModel(models.Model):
    nombre = models.CharField(max_length=150)
    correo = models.EmailField()
    documento_identidad = models.CharField("documento de identidad", max_length=30, blank=True)
    tipo = models.CharField(
        max_length=20,
        choices=[
            (TipoSolicitudDatos.CONSULTA, "Consulta"),
            (TipoSolicitudDatos.ACTUALIZACION, "Actualización"),
            (TipoSolicitudDatos.RECTIFICACION, "Rectificación"),
            (TipoSolicitudDatos.SUPRESION, "Supresión"),
            (TipoSolicitudDatos.REVOCATORIA, "Revocatoria de la autorización"),
        ],
    )
    descripcion = models.TextField("descripción")
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="solicitudes_datos",
        help_text="Cuenta del titular, si la radicó con sesión iniciada.",
    )
    estado = models.CharField(
        max_length=20,
        choices=[
            (EstadoSolicitudDatos.RECIBIDA, "Recibida"),
            (EstadoSolicitudDatos.EN_TRAMITE, "En trámite"),
            (EstadoSolicitudDatos.RESUELTA, "Resuelta"),
        ],
        default=EstadoSolicitudDatos.RECIBIDA,
    )
    respuesta = models.TextField(blank=True)
    fecha_solicitud = models.DateTimeField("fecha de solicitud")
    fecha_limite = models.DateField("fecha límite de respuesta")
    fecha_respuesta = models.DateTimeField("fecha de respuesta", null=True, blank=True)
    atendida_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="solicitudes_datos_atendidas",
    )
    fecha_ultima_alerta = models.DateField("fecha de la última alerta", null=True, blank=True)

    class Meta:
        db_table = "solicitudes_datos_personales"
        verbose_name = "solicitud de datos personales"
        verbose_name_plural = "solicitudes de datos personales"
        ordering = ["fecha_limite"]

    def __str__(self):
        return f"Radicado {self.id} - {self.get_tipo_display()} - {self.nombre}"
