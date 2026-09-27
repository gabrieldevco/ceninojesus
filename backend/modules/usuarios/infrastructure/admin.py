from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm

from .models import Usuario


class UsuarioCreationForm(BaseUserCreationForm):
    class Meta:
        model = Usuario
        fields = ["nombre_usuario", "correo"]


class UsuarioChangeForm(UserChangeForm):
    class Meta:
        model = Usuario
        fields = "__all__"


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    form = UsuarioChangeForm
    add_form = UsuarioCreationForm

    list_display = ["nombre_usuario", "correo", "nombres", "apellidos", "is_staff", "is_active"]
    list_filter = ["is_staff", "is_superuser", "is_active", "groups"]
    search_fields = ["nombre_usuario", "correo", "nombres", "apellidos"]
    ordering = ["nombre_usuario"]

    fieldsets = [
        (None, {"fields": ["nombre_usuario", "password"]}),
        ("Información personal", {"fields": ["nombres", "apellidos", "correo"]}),
        ("Permisos", {"fields": ["is_active", "is_staff", "is_superuser", "groups", "user_permissions"]}),
        ("Fechas", {"fields": ["last_login", "fecha_registro"]}),
    ]
    add_fieldsets = [
        (None, {"classes": ["wide"], "fields": ["nombre_usuario", "correo", "password1", "password2"]}),
    ]
