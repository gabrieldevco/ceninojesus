from django.contrib import admin

from .models import NotificacionModel


@admin.register(NotificacionModel)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ["titulo", "usuario", "leida", "fecha_creacion"]
    list_filter = ["leida"]
    search_fields = ["titulo", "usuario__nombre_usuario"]
