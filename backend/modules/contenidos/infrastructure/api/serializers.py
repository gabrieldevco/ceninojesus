from django.urls import reverse
from rest_framework import serializers

from modules.contenidos.domain.entities import TipoMaterial
from shared.infrastructure.archivos import validar_archivo_permitido


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

    def validate_archivo(self, archivo):
        return validar_archivo_permitido(archivo)

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


class NuevaEntregaSerializer(serializers.Serializer):
    texto = serializers.CharField(required=False, allow_blank=True, default="", max_length=5000)
    url = serializers.URLField(max_length=500, required=False, allow_blank=True, default="")
    archivo = serializers.FileField(write_only=True, required=False)

    def validate_archivo(self, archivo):
        return validar_archivo_permitido(archivo)


class CalificacionSerializer(serializers.Serializer):
    calificacion = serializers.DecimalField(max_digits=2, decimal_places=1, allow_null=True)
    comentario = serializers.CharField(required=False, allow_blank=True, default="", max_length=3000)


def entrega_a_dict(item, grupo_id: int, request=None) -> dict:
    """`item` es un EntregaConActividad: la entrega y si llegó después de la fecha límite."""
    entrega = item.entrega
    archivo_url = None
    if entrega.archivo:
        ruta = reverse(
            "entrega-archivo",
            kwargs={"grupo_id": grupo_id, "contenido_id": entrega.actividad_id, "entrega_id": entrega.id},
        )
        archivo_url = request.build_absolute_uri(ruta) if request else ruta
    return {
        "id": entrega.id,
        "actividad_id": entrega.actividad_id,
        "estudiante_id": entrega.estudiante_usuario_id,
        "estudiante_nombre": entrega.estudiante_nombre,
        "texto": entrega.texto,
        "url": entrega.url,
        "archivo_url": archivo_url,
        "archivo_nombre": entrega.archivo.rsplit("/", 1)[-1] if entrega.archivo else "",
        "fecha_entrega": entrega.fecha_entrega.isoformat(),
        "tarde": item.tarde,
        "calificacion": str(entrega.calificacion) if entrega.calificacion is not None else None,
        "comentario_docente": entrega.comentario_docente,
        "fecha_calificacion": entrega.fecha_calificacion.isoformat() if entrega.fecha_calificacion else None,
    }
