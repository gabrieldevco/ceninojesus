from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from shared.domain.actor import Rol


def _validar_contrasena(value):
    validate_password(value)
    return value


class UsuarioSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre_usuario = serializers.CharField()
    rol = serializers.CharField()
    correo = serializers.EmailField()
    nombres = serializers.CharField()
    apellidos = serializers.CharField()
    telefono = serializers.CharField()
    activo = serializers.BooleanField()
    fecha_autorizacion_datos = serializers.DateTimeField(allow_null=True)


class _NuevoUsuarioSerializer(serializers.Serializer):
    nombre_usuario = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[_validar_contrasena])
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")


class RegistroSerializer(_NuevoUsuarioSerializer):
    correo = serializers.EmailField()
    nombres = serializers.CharField(max_length=150)
    apellidos = serializers.CharField(max_length=150)
    autoriza_tratamiento_datos = serializers.BooleanField()


class CrearUsuarioSerializer(_NuevoUsuarioSerializer):
    correo = serializers.EmailField(required=False, allow_blank=True, default="")
    nombres = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    apellidos = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    rol = serializers.ChoiceField(choices=[rol.value for rol in Rol])


class ActualizarPerfilSerializer(serializers.Serializer):
    correo = serializers.EmailField(required=False, allow_blank=True)
    nombres = serializers.CharField(max_length=150, required=False, allow_blank=True)
    apellidos = serializers.CharField(max_length=150, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True)


class ActualizarUsuarioSerializer(ActualizarPerfilSerializer):
    rol = serializers.ChoiceField(choices=[rol.value for rol in Rol], required=False)
    activo = serializers.BooleanField(required=False)

    def validate_rol(self, value):
        return Rol(value)


class SolicitarRecuperacionSerializer(serializers.Serializer):
    identificador = serializers.CharField(max_length=254, help_text="Nombre de usuario o correo.")


class ConfirmarRecuperacionSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[_validar_contrasena])


class CambiarContrasenaSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nueva = serializers.CharField(write_only=True, validators=[_validar_contrasena])


class NuevaContrasenaSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, validators=[_validar_contrasena])


class EstudianteSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombres = serializers.CharField()
    apellidos = serializers.CharField()
    documento_identidad = serializers.CharField()
    fecha_nacimiento = serializers.DateField(allow_null=True)
    grado = serializers.CharField()
    acudiente_id = serializers.IntegerField()
    usuario_id = serializers.IntegerField(allow_null=True)
    fecha_autorizacion_datos = serializers.DateTimeField(allow_null=True)


class RegistrarEstudianteSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=150)
    apellidos = serializers.CharField(max_length=150)
    documento_identidad = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True, default=None)
    grado = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    acudiente_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    autoriza_tratamiento_datos = serializers.BooleanField()


class ActualizarEstudianteSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=150, required=False)
    apellidos = serializers.CharField(max_length=150, required=False)
    documento_identidad = serializers.CharField(max_length=30, required=False, allow_blank=True)
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)
    grado = serializers.CharField(max_length=30, required=False, allow_blank=True)


class AccesoEstudianteSerializer(serializers.Serializer):
    nombre_usuario = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[_validar_contrasena])
