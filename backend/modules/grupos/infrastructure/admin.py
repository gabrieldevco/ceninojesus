from django.contrib import admin

from .models import GrupoAdministradorModel, GrupoExtracurricularModel, SolicitudMatriculaModel


class GrupoAdministradorInline(admin.TabularInline):
    model = GrupoAdministradorModel
    extra = 0
    autocomplete_fields = ["usuario"]


@admin.register(GrupoExtracurricularModel)
class GrupoExtracurricularAdmin(admin.ModelAdmin):
    list_display = ["nombre", "horario", "cupo_maximo", "activo"]
    list_filter = ["activo"]
    search_fields = ["nombre"]
    inlines = [GrupoAdministradorInline]


@admin.register(SolicitudMatriculaModel)
class SolicitudMatriculaAdmin(admin.ModelAdmin):
    list_display = ["estudiante", "grupo", "acudiente", "estado", "fecha_solicitud", "fecha_respuesta"]
    list_filter = ["estado", "grupo"]
    search_fields = ["estudiante__nombres", "estudiante__apellidos", "acudiente__nombre_usuario"]
    autocomplete_fields = ["estudiante", "acudiente", "respondida_por"]
