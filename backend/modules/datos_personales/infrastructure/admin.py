from django.contrib import admin

from .models import SolicitudDatosModel


@admin.register(SolicitudDatosModel)
class SolicitudDatosAdmin(admin.ModelAdmin):
    list_display = ["id", "tipo", "nombre", "correo", "estado", "fecha_solicitud", "fecha_limite"]
    list_filter = ["estado", "tipo"]
    search_fields = ["nombre", "correo", "documento_identidad"]
    readonly_fields = ["fecha_solicitud", "fecha_limite"]
