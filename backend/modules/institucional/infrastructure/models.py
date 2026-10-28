import uuid

from django.db import models

from modules.institucional.domain.entities import SeccionLanding, TipoEnlace


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
    portada_etiqueta = models.CharField("etiqueta de la portada", max_length=100, blank=True)
    portada_titulo = models.CharField("título de la portada", max_length=200, blank=True)
    portada_destacado = models.CharField("parte destacada del título", max_length=200, blank=True)
    portada_texto = models.TextField("texto de la portada", blank=True)
    quienes_principal = models.TextField("quiénes somos (principal)", blank=True)
    quienes_secundario = models.TextField("quiénes somos (secundario)", blank=True)
    enfoque_titulo = models.CharField("título del enfoque", max_length=200, blank=True)
    enfoque_texto = models.TextField("texto del enfoque", blank=True)
    enfoque_pasos = models.CharField("pasos del enfoque (separados por comas)", max_length=300, blank=True)
    enfoque_nota = models.CharField("nota del enfoque", max_length=300, blank=True)
    horizonte_pendiente_validacion = models.BooleanField(
        "historia, misión y visión pendientes de validación", default=True
    )
    contacto_titulo = models.CharField("título de contacto", max_length=200, blank=True)
    contacto_texto = models.TextField("texto de contacto", blank=True)
    pie_descripcion = models.TextField("descripción del pie de página", blank=True)

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


def _ruta_imagen_landing(instancia, nombre_archivo):
    extension = nombre_archivo.rsplit(".", 1)[-1].lower() if "." in nombre_archivo else "bin"
    return f"landing/{instancia.seccion}/{uuid.uuid4().hex}.{extension}"


class ElementoLandingModel(models.Model):
    seccion = models.CharField(
        max_length=30, choices=[(s.value, s.name.replace("_", " ").title()) for s in SeccionLanding]
    )
    titulo = models.CharField("título", max_length=200, blank=True)
    texto = models.TextField(blank=True)
    detalle = models.CharField(max_length=200, blank=True)
    icono = models.CharField("ícono", max_length=50, blank=True)
    imagen_estatica = models.CharField("imagen incluida con el sitio", max_length=200, blank=True)
    imagen = models.FileField("imagen subida", upload_to=_ruta_imagen_landing, blank=True)
    orden = models.PositiveIntegerField(default=0)
    activo = models.BooleanField(default=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "elementos_landing"
        verbose_name = "elemento de la página de inicio"
        verbose_name_plural = "elementos de la página de inicio"
        ordering = ["seccion", "orden", "id"]

    def __str__(self):
        return f"{self.seccion}: {self.titulo or self.pk}"
