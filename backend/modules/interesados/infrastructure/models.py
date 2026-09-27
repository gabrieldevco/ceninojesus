from django.db import models

from modules.interesados.domain.entities import EstadoInteresado


class InteresadoModel(models.Model):
    nombre_completo = models.CharField(max_length=150)
    correo = models.EmailField()
    telefono = models.CharField(max_length=20)
    mensaje = models.TextField(blank=True)
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
