from django.conf import settings
from django.db import models


class NotificacionModel(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notificaciones")
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField()

    class Meta:
        db_table = "notificaciones"
        verbose_name = "notificación"
        verbose_name_plural = "notificaciones"
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return self.titulo
