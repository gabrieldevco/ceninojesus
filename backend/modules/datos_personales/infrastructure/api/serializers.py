from rest_framework import serializers

from modules.datos_personales.domain.entities import EstadoSolicitudDatos, TipoSolicitudDatos


class SolicitudDatosSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(max_length=150)
    correo = serializers.EmailField()
    documento_identidad = serializers.CharField(max_length=30, required=False, allow_blank=True, default="")
    tipo = serializers.ChoiceField(choices=[tipo.value for tipo in TipoSolicitudDatos])
    descripcion = serializers.CharField()
    estado = serializers.CharField(read_only=True)
    respuesta = serializers.CharField(read_only=True)
    fecha_solicitud = serializers.DateTimeField(read_only=True)
    fecha_limite = serializers.DateField(read_only=True)
    fecha_respuesta = serializers.DateTimeField(read_only=True, allow_null=True)

    def validate_tipo(self, value):
        return TipoSolicitudDatos(value)


class ResponderSerializer(serializers.Serializer):
    respuesta = serializers.CharField()


ESTADOS = [estado.value for estado in EstadoSolicitudDatos]
