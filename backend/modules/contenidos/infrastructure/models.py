from django.conf import settings
from django.db import models

from modules.contenidos.domain.entities import TipoMaterial


class ContenidoBaseModel(models.Model):
    grupo = models.ForeignKey("grupos.GrupoExtracurricularModel", on_delete=models.CASCADE)
    titulo = models.CharField("título", max_length=200)
    descripcion = models.TextField("descripción", blank=True)
    archivo = models.FileField(max_length=255, blank=True)
    url = models.URLField("URL", max_length=500, blank=True)
    publicado = models.BooleanField(default=True)
    fecha_publicacion = models.DateTimeField("fecha de publicación")
    autor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)

    class Meta:
        abstract = True
        ordering = ["-fecha_publicacion"]

    def __str__(self):
        return self.titulo


class MaterialApoyoModel(ContenidoBaseModel):
    tipo = models.CharField(
        max_length=20,
        choices=[
            (TipoMaterial.DOCUMENTO, "Documento"),
            (TipoMaterial.VIDEO, "Video"),
            (TipoMaterial.ENLACE, "Enlace"),
        ],
        default=TipoMaterial.DOCUMENTO,
    )

    class Meta(ContenidoBaseModel.Meta):
        db_table = "materiales_apoyo"
        verbose_name = "material de apoyo"
        verbose_name_plural = "materiales de apoyo"


class ActividadModel(ContenidoBaseModel):
    fecha_entrega = models.DateTimeField("fecha de entrega", null=True, blank=True)

    class Meta(ContenidoBaseModel.Meta):
        db_table = "actividades"
        verbose_name = "actividad"
        verbose_name_plural = "actividades"
