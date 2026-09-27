from django.contrib import admin

from .models import InteresadoModel


@admin.register(InteresadoModel)
class InteresadoAdmin(admin.ModelAdmin):
    list_display = ["nombre_completo", "email", "telefono", "estado", "fecha_registro"]
    list_filter = ["estado"]
    search_fields = ["nombre_completo", "email", "telefono"]
