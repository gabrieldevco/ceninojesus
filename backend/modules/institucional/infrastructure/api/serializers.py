from rest_framework import serializers

from modules.institucional.domain.entities import SeccionLanding, TipoEnlace
from shared.infrastructure.archivos import validar_imagen


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
    portada_etiqueta = serializers.CharField(max_length=100, required=False, allow_blank=True)
    portada_titulo = serializers.CharField(max_length=200, required=False, allow_blank=True)
    portada_destacado = serializers.CharField(max_length=200, required=False, allow_blank=True)
    portada_texto = serializers.CharField(required=False, allow_blank=True)
    quienes_principal = serializers.CharField(required=False, allow_blank=True)
    quienes_secundario = serializers.CharField(required=False, allow_blank=True)
    enfoque_titulo = serializers.CharField(max_length=200, required=False, allow_blank=True)
    enfoque_texto = serializers.CharField(required=False, allow_blank=True)
    enfoque_pasos = serializers.CharField(max_length=300, required=False, allow_blank=True)
    enfoque_nota = serializers.CharField(max_length=300, required=False, allow_blank=True)
    horizonte_pendiente_validacion = serializers.BooleanField(required=False)
    contacto_titulo = serializers.CharField(max_length=200, required=False, allow_blank=True)
    contacto_texto = serializers.CharField(required=False, allow_blank=True)
    pie_descripcion = serializers.CharField(required=False, allow_blank=True)


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


class ElementoLandingSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    seccion = serializers.ChoiceField(choices=[s.value for s in SeccionLanding])
    titulo = serializers.CharField(max_length=200, required=False, allow_blank=True)
    texto = serializers.CharField(required=False, allow_blank=True)
    detalle = serializers.CharField(max_length=200, required=False, allow_blank=True)
    icono = serializers.CharField(max_length=50, required=False, allow_blank=True)
    orden = serializers.IntegerField(min_value=0, required=False)
    activo = serializers.BooleanField(required=False)
    imagen = serializers.SerializerMethodField()
    tiene_imagen_subida = serializers.BooleanField(read_only=True)

    def get_imagen(self, elemento):
        if elemento.tiene_imagen_subida:
            # La versión cambia al subir otra imagen: el navegador puede guardarla en caché sin quedar desactualizado
            version = int(elemento.actualizado.timestamp()) if elemento.actualizado else 0
            return f"/api/institucional/elementos/{elemento.id}/imagen/?v={version}"
        return elemento.imagen_estatica

    def validate_seccion(self, value):
        return SeccionLanding(value)


class ImagenSerializer(serializers.Serializer):
    imagen = serializers.FileField(validators=[validar_imagen])
