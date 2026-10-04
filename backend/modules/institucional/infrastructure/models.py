from django.db import models

from modules.institucional.domain.entities import TipoEnlace


class InformacionInstitucionalModel(models.Model):
    nombre = models.CharField(max_length=200)
    historia = models.TextField(blank=True)
    mision = models.TextField("misión", blank=True)
    vision = models.TextField("visión", blank=True)
    direccion = models.CharField("dirección", max_length=200, blank=True)
    ciudad = models.CharField(max_length=100, blank=True)
    telefonos = models.CharField("teléfonos", max_length=100, blank=True)
    correo = models.EmailField(blank=True)
    horario_atencion = models.CharField("horario de atención", max_length=200, blank=True)
    url_mapa = models.URLField("URL del mapa", max_length=500, blank=True)
    url_facebook = models.URLField("URL de Facebook", blank=True)
    politica_tratamiento_datos = models.TextField("política de tratamiento de datos personales", blank=True)

    class Meta:
        db_table = "informacion_institucional"
        verbose_name = "información institucional"
        verbose_name_plural = "información institucional"

    def __str__(self):
        return self.nombre


class EnlacePortalModel(models.Model):
    nombre = models.CharField(max_length=100)
    url = models.URLField(max_length=500)
    tipo = models.CharField(
        max_length=30,
        choices=[
            (TipoEnlace.SISTEMA_ADMINISTRATIVO, "Sistema administrativo"),
            (TipoEnlace.BIBLIOTECA, "Biblioteca"),
            (TipoEnlace.OTRO, "Otro"),
        ],
    )
    descripcion = models.CharField("descripción", max_length=255, blank=True)
    requiere_autenticacion = models.BooleanField("requiere autenticación", default=False)
    orden = models.PositiveIntegerField(default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "enlaces_portal"
        verbose_name = "enlace del portal"
        verbose_name_plural = "enlaces del portal"
        ordering = ["orden", "nombre"]

    def __str__(self):
        return self.nombre


class MensajeContactoModel(models.Model):
    nombre = models.CharField(max_length=150)
    correo = models.EmailField()
    telefono = models.CharField("teléfono", max_length=20, blank=True)
    asunto = models.CharField(max_length=200)
    mensaje = models.TextField()
    autoriza_tratamiento_datos = models.BooleanField()
    leido = models.BooleanField("leído", default=False)
    fecha_envio = models.DateTimeField("fecha de envío")

    class Meta:
        db_table = "mensajes_contacto"
        verbose_name = "mensaje de contacto"
        verbose_name_plural = "mensajes de contacto"
        ordering = ["-fecha_envio"]

    def __str__(self):
        return f"{self.asunto} - {self.nombre}"
