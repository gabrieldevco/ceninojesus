from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm

from .models import EstudianteModel, Usuario


class UsuarioCreationForm(BaseUserCreationForm):
    class Meta:
        model = Usuario
        fields = ["nombre_usuario", "correo", "rol"]


class UsuarioChangeForm(UserChangeForm):
    class Meta:
        model = Usuario
        fields = "__all__"


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm

    list_display = ["nombre_usuario", "correo", "nombres", "apellidos", "rol", "is_active"]
    list_filter = ["rol", "is_staff", "is_superuser", "is_active"]
    search_fields = ["nombre_usuario", "correo", "nombres", "apellidos"]
    ordering = ["nombre_usuario"]

    fieldsets = [
        (None, {"fields": ["nombre_usuario", "password", "rol"]}),
        ("Información personal", {"fields": ["nombres", "apellidos", "correo", "telefono"]}),
        ("Permisos", {"fields": ["is_active", "is_staff", "is_superuser", "groups", "user_permissions"]}),
        ("Fechas", {"fields": ["last_login", "fecha_registro"]}),
    ]
    add_fieldsets = [
        (None, {"classes": ["wide"], "fields": ["nombre_usuario", "correo", "rol", "password1", "password2"]}),
    ]


@admin.register(EstudianteModel)
class EstudianteAdmin(admin.ModelAdmin):
    list_display = ["nombres", "apellidos", "grado", "acudiente", "usuario"]
    list_filter = ["grado"]
    search_fields = ["nombres", "apellidos", "documento_identidad", "acudiente__nombre_usuario"]
    autocomplete_fields = ["acudiente", "usuario"]
