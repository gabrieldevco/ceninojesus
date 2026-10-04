from django.contrib import admin

from .models import InteresadoModel, RecordatorioInteresadoModel, SeguimientoInteresadoModel


class SeguimientoInline(admin.TabularInline):
    model = SeguimientoInteresadoModel
    extra = 0
    readonly_fields = ["usuario", "nota", "fecha"]
    can_delete = False


class RecordatorioInline(admin.TabularInline):
    model = RecordatorioInteresadoModel
    extra = 0
    readonly_fields = ["fecha_envio"]
    can_delete = False


@admin.register(InteresadoModel)
class InteresadoAdmin(admin.ModelAdmin):
    list_display = ["nombre_completo", "correo", "telefono", "grado_interes", "estado", "fecha_registro"]
    list_filter = ["estado"]
    search_fields = ["nombre_completo", "correo", "telefono", "nombre_aspirante"]
    inlines = [SeguimientoInline, RecordatorioInline]
