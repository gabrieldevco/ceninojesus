from rest_framework import serializers


class NotificacionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    titulo = serializers.CharField()
    mensaje = serializers.CharField()
    leida = serializers.BooleanField()
    fecha_creacion = serializers.DateTimeField()
