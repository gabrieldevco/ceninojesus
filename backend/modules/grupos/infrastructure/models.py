from django.conf import settings
from django.db import models
from django.utils import timezone

from modules.grupos.domain.entities import EstadoSolicitud


class GrupoExtracurricularModel(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField("descripción", blank=True)
    horario = models.CharField(max_length=200, blank=True)
    cupo_maximo = models.PositiveIntegerField("cupo máximo", null=True, blank=True, help_text="Vacío = sin límite.")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField("fecha de creación", default=timezone.now)
    administradores = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="GrupoAdministradorModel",
        related_name="grupos_administrados",
        blank=True,
    )

    class Meta:
        db_table = "grupos_extracurriculares"
        verbose_name = "grupo extracurricular"
        verbose_name_plural = "grupos extracurriculares"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class GrupoAdministradorModel(models.Model):
    grupo = models.ForeignKey(GrupoExtracurricularModel, on_delete=models.CASCADE)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_asignacion = models.DateTimeField("fecha de asignación", default=timezone.now)

    class Meta:
        db_table = "grupos_administradores"
        verbose_name = "administrador de grupo"
        verbose_name_plural = "administradores de grupo"
        constraints = [models.UniqueConstraint(fields=["grupo", "usuario"], name="grupo_administrador_unico")]


class SolicitudMatriculaModel(models.Model):
    grupo = models.ForeignKey(GrupoExtracurricularModel, on_delete=models.PROTECT, related_name="solicitudes")
    estudiante = models.ForeignKey("usuarios.EstudianteModel", on_delete=models.PROTECT, related_name="solicitudes")
    acudiente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="solicitudes")
    comentario = models.TextField(blank=True)
    estado = models.CharField(
        max_length=20,
        choices=[
            (EstadoSolicitud.PENDIENTE, "Pendiente"),
            (EstadoSolicitud.APROBADA, "Aprobada"),
            (EstadoSolicitud.RECHAZADA, "Rechazada"),
        ],
        default=EstadoSolicitud.PENDIENTE,
    )
    respuesta = models.TextField(blank=True)
    fecha_solicitud = models.DateTimeField("fecha de solicitud")
    fecha_respuesta = models.DateTimeField("fecha de respuesta", null=True, blank=True)
    respondida_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="solicitudes_respondidas",
    )

    class Meta:
        db_table = "solicitudes_matricula"
        verbose_name = "solicitud de matrícula"
        verbose_name_plural = "solicitudes de matrícula"
        ordering = ["-fecha_solicitud"]
        constraints = [
            # Respaldo en base de datos de la regla SolicitudDuplicada
            models.UniqueConstraint(
                fields=["estudiante", "grupo"],
                condition=models.Q(estado__in=[EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA]),
                name="solicitud_activa_unica",
            )
        ]

    def __str__(self):
        return f"{self.estudiante} - {self.grupo} ({self.estado})"
