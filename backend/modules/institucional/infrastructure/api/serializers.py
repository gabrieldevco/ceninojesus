from rest_framework import serializers

from modules.institucional.domain.entities import TipoEnlace


class InformacionSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, required=False, allow_blank=True)
    historia = serializers.CharField(required=False, allow_blank=True)
    mision = serializers.CharField(required=False, allow_blank=True)
    vision = serializers.CharField(required=False, allow_blank=True)
    direccion = serializers.CharField(max_length=200, required=False, allow_blank=True)
    ciudad = serializers.CharField(max_length=100, required=False, allow_blank=True)
    telefonos = serializers.CharField(max_length=100, required=False, allow_blank=True)
    correo = serializers.EmailField(required=False, allow_blank=True)
    horario_atencion = serializers.CharField(max_length=200, required=False, allow_blank=True)
    url_mapa = serializers.URLField(max_length=500, required=False, allow_blank=True)
    url_facebook = serializers.URLField(required=False, allow_blank=True)
    politica_tratamiento_datos = serializers.CharField(required=False, allow_blank=True)


class EnlaceSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(max_length=100)
    url = serializers.URLField(max_length=500)
    tipo = serializers.ChoiceField(choices=[tipo.value for tipo in TipoEnlace])
    descripcion = serializers.CharField(max_length=255, required=False, allow_blank=True)
    requiere_autenticacion = serializers.BooleanField(required=False, default=False)
    orden = serializers.IntegerField(min_value=0, required=False)
    activo = serializers.BooleanField(required=False, default=True)

    def validate_tipo(self, value):
        return TipoEnlace(value)


class MensajeContactoSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(max_length=150)
    correo = serializers.EmailField()
    telefono = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    asunto = serializers.CharField(max_length=200)
    mensaje = serializers.CharField()
    autoriza_tratamiento_datos = serializers.BooleanField()
    leido = serializers.BooleanField(read_only=True)
    fecha_envio = serializers.DateTimeField(read_only=True)
