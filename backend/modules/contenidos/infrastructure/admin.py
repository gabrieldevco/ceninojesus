from django.contrib import admin

from .models import ActividadModel, EntregaModel, MaterialApoyoModel


@admin.register(MaterialApoyoModel)
class MaterialApoyoAdmin(admin.ModelAdmin):
    list_display = ["titulo", "grupo", "tipo", "publicado", "fecha_publicacion"]
    list_filter = ["grupo", "tipo", "publicado"]
    search_fields = ["titulo"]


@admin.register(ActividadModel)
class ActividadAdmin(admin.ModelAdmin):
    list_display = ["titulo", "grupo", "fecha_entrega", "publicado", "fecha_publicacion"]
    list_filter = ["grupo", "publicado"]
    search_fields = ["titulo"]


@admin.register(EntregaModel)
class EntregaAdmin(admin.ModelAdmin):
    list_display = ["actividad", "estudiante", "fecha_entrega", "calificacion"]
    list_filter = ["actividad__grupo"]
    search_fields = ["actividad__titulo", "estudiante__nombre_usuario"]
