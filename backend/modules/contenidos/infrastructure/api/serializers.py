from django.urls import reverse
from rest_framework import serializers

from modules.contenidos.domain.entities import TipoMaterial


class _ContenidoSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    grupo_id = serializers.IntegerField(read_only=True)
    titulo = serializers.CharField(max_length=200)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    url = serializers.URLField(max_length=500, required=False, allow_blank=True)
    publicado = serializers.BooleanField(required=False, default=True)
    fecha_publicacion = serializers.DateTimeField(read_only=True)
    autor_id = serializers.IntegerField(read_only=True)
    archivo = serializers.FileField(write_only=True, required=False)
    archivo_url = serializers.SerializerMethodField()

    tipo_contenido = None  # "materiales" o "actividades"

    def get_archivo_url(self, contenido):
        if not contenido.archivo:
            return None
        ruta = reverse(
            f"{self.tipo_contenido}-archivo",
            kwargs={"grupo_id": contenido.grupo_id, "contenido_id": contenido.id},
        )
        request = self.context.get("request")
        return request.build_absolute_uri(ruta) if request else ruta


class MaterialSerializer(_ContenidoSerializer):
    tipo_contenido = "materiales"
    tipo = serializers.ChoiceField(choices=[tipo.value for tipo in TipoMaterial], required=False)

    def validate_tipo(self, value):
        return TipoMaterial(value)


class ActividadSerializer(_ContenidoSerializer):
    tipo_contenido = "actividades"
    fecha_entrega = serializers.DateTimeField(required=False, allow_null=True)


SERIALIZERS = {"materiales": MaterialSerializer, "actividades": ActividadSerializer}
