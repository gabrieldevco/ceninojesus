from rest_framework import serializers

from modules.grupos.domain.entities import EstadoSolicitud


class GrupoSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(max_length=100)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    horario = serializers.CharField(max_length=200, required=False, allow_blank=True)
    cupo_maximo = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    activo = serializers.BooleanField(required=False, default=True)
    administrador_ids = serializers.ListField(child=serializers.IntegerField(), read_only=True)


class AsignarAdministradoresSerializer(serializers.Serializer):
    administrador_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)


class InscritoSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    nombre_completo = serializers.CharField()
    grado = serializers.CharField()


class SolicitudSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    grupo_id = serializers.IntegerField()
    grupo_nombre = serializers.CharField()
    estudiante_id = serializers.IntegerField()
    estudiante_nombre = serializers.CharField()
    acudiente_id = serializers.IntegerField()
    comentario = serializers.CharField()
    estado = serializers.CharField()
    respuesta = serializers.CharField()
    fecha_solicitud = serializers.DateTimeField()
    fecha_respuesta = serializers.DateTimeField(allow_null=True)


class CrearSolicitudSerializer(serializers.Serializer):
    grupo_id = serializers.IntegerField()
    estudiante_id = serializers.IntegerField()
    comentario = serializers.CharField(required=False, allow_blank=True, default="")


class AprobarSerializer(serializers.Serializer):
    respuesta = serializers.CharField(required=False, allow_blank=True, default="")


class RechazarSerializer(serializers.Serializer):
    motivo = serializers.CharField()


ESTADOS = [estado.value for estado in EstadoSolicitud]
