from rest_framework import serializers

from modules.interesados.domain.entities import EstadoInteresado


class RegistrarInteresadoSerializer(serializers.Serializer):
    nombre_completo = serializers.CharField(max_length=150)
    correo = serializers.EmailField()
    telefono = serializers.CharField(max_length=20)
    mensaje = serializers.CharField(required=False, allow_blank=True, default="")
    autoriza_tratamiento_datos = serializers.BooleanField()


class CambiarEstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=[estado.value for estado in EstadoInteresado])


class InteresadoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre_completo = serializers.CharField()
    correo = serializers.EmailField()
    telefono = serializers.CharField()
    mensaje = serializers.CharField()
    estado = serializers.CharField()
    fecha_registro = serializers.DateTimeField()
    fecha_ultimo_contacto = serializers.DateTimeField(allow_null=True)
