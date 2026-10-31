from django.contrib import admin

from .models import ElementoLandingModel, EnlacePortalModel, InformacionInstitucionalModel, MensajeContactoModel


@admin.register(InformacionInstitucionalModel)
class InformacionInstitucionalAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        # Registro único
        return not InformacionInstitucionalModel.objects.exists()


@admin.register(EnlacePortalModel)
class EnlacePortalAdmin(admin.ModelAdmin):
    list_display = ["nombre", "tipo", "url", "requiere_autenticacion", "orden", "activo"]
    list_editable = ["orden", "activo"]
    list_filter = ["tipo", "activo"]


@admin.register(MensajeContactoModel)
class MensajeContactoAdmin(admin.ModelAdmin):
    list_display = ["asunto", "nombre", "correo", "leido", "fecha_envio"]
    list_filter = ["leido"]
    search_fields = ["asunto", "nombre", "correo"]


@admin.register(ElementoLandingModel)
class ElementoLandingAdmin(admin.ModelAdmin):
    list_display = ["seccion", "titulo", "orden", "activo"]
    list_editable = ["orden", "activo"]
    list_filter = ["seccion", "activo"]
