from django.conf import settings
from django.db import models

from modules.interesados.domain.entities import EstadoInteresado


class InteresadoModel(models.Model):
    nombre_completo = models.CharField(max_length=150)
    # blank=True: quedan vacíos cuando se anonimiza el registro (Ley 1581)
    correo = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    mensaje = models.TextField(blank=True)
    nombre_aspirante = models.CharField("nombre del aspirante", max_length=150, blank=True)
    grado_interes = models.CharField("grado de interés", max_length=30, blank=True)
    autoriza_tratamiento_datos = models.BooleanField()
    estado = models.CharField(
        max_length=20,
        choices=[(estado.value, estado.name.replace("_", " ").capitalize()) for estado in EstadoInteresado],
        default=EstadoInteresado.NUEVO.value,
    )
    fecha_registro = models.DateTimeField()
    fecha_ultimo_contacto = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "interesados"
        verbose_name = "interesado"
        verbose_name_plural = "interesados"
        ordering = ["-fecha_registro"]

    def __str__(self):
        return self.nombre_completo


class SeguimientoInteresadoModel(models.Model):
    interesado = models.ForeignKey(InteresadoModel, on_delete=models.CASCADE, related_name="seguimientos")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    nota = models.TextField()
    fecha = models.DateTimeField()

    class Meta:
        db_table = "seguimientos_interesados"
        verbose_name = "seguimiento"
        verbose_name_plural = "seguimientos"
        ordering = ["-fecha"]


class RecordatorioInteresadoModel(models.Model):
    interesado = models.ForeignKey(InteresadoModel, on_delete=models.CASCADE, related_name="recordatorios")
    fecha_envio = models.DateTimeField("fecha de envío")

    class Meta:
        db_table = "recordatorios_interesados"
        verbose_name = "recordatorio"
        verbose_name_plural = "recordatorios"
        ordering = ["-fecha_envio"]
