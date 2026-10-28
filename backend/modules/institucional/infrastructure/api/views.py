import mimetypes
from dataclasses import asdict

from django.core.files.storage import default_storage
from django.http import FileResponse
from rest_framework import serializers, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.institucional.application.use_cases import DatosElemento, DatosEnlace, DatosMensaje
from modules.institucional.domain.entities import SECCIONES_DE_IMAGEN_UNICA, SeccionLanding
from modules.institucional.infrastructure import dependencies
from shared.infrastructure.permissions import EsAdministrador, actor_desde_request
from shared.infrastructure.throttling import LimiteEnvios

from .serializers import (
    ElementoLandingSerializer,
    EnlaceSerializer,
    ImagenSerializer,
    InformacionSerializer,
    MensajeContactoSerializer,
)


def _es_administrador(request):
    return request.user.is_authenticated and actor_desde_request(request).es_administrador


class InformacionView(APIView):
    """RF-01 / RF-02: lectura pública, edición del administrador."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [EsAdministrador()]

    def get(self, request):
        return Response(asdict(dependencies.obtener_informacion().execute()))

    def patch(self, request):
        serializer = InformacionSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        informacion = dependencies.actualizar_informacion().execute(serializer.validated_data)
        return Response(asdict(informacion))


class PoliticaDatosView(APIView):
    """Ley 1581: política de tratamiento de datos, para enlazarla en cada formulario con autorización."""

    permission_classes = [AllowAny]

    def get(self, request):
        informacion = dependencies.obtener_informacion().execute()
        return Response({"politica": informacion.politica_tratamiento_datos, "correo": informacion.correo})


class EnlaceListCreateView(APIView):
    """RF-04 / RF-05: enlaces al sistema administrativo y a la biblioteca."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [EsAdministrador()]

    def get(self, request):
        es_admin = _es_administrador(request)
        incluir_inactivos = es_admin and request.query_params.get("todos") in ("1", "true")
        enlaces = dependencies.listar_enlaces().execute(request.user.is_authenticated, incluir_inactivos)
        return Response(EnlaceSerializer(enlaces, many=True).data)

    def post(self, request):
        serializer = EnlaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enlace = dependencies.crear_enlace().execute(DatosEnlace(**serializer.validated_data))
        return Response(EnlaceSerializer(enlace).data, status=status.HTTP_201_CREATED)


class EnlaceDetailView(APIView):
    permission_classes = [EsAdministrador]

    def patch(self, request, enlace_id):
        serializer = EnlaceSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        enlace = dependencies.actualizar_enlace().execute(enlace_id, serializer.validated_data)
        return Response(EnlaceSerializer(enlace).data)

    def delete(self, request, enlace_id):
        dependencies.eliminar_enlace().execute(enlace_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MensajeContactoListCreateView(APIView):
    """RF-03: formulario público de contacto; el administrador consulta los mensajes."""

    throttle_classes = [LimiteEnvios]
    throttle_scope = "formularios"

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "POST" else [EsAdministrador()]

    def get(self, request):
        solo_no_leidos = request.query_params.get("no_leidos") in ("1", "true")
        mensajes = dependencies.listar_mensajes().execute(solo_no_leidos)
        return Response(MensajeContactoSerializer(mensajes, many=True).data)

    def post(self, request):
        serializer = MensajeContactoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mensaje = dependencies.enviar_mensaje_contacto().execute(DatosMensaje(**serializer.validated_data))
        return Response(MensajeContactoSerializer(mensaje).data, status=status.HTTP_201_CREATED)


class MarcarMensajeLeidoView(APIView):
    permission_classes = [EsAdministrador]

    def post(self, request, mensaje_id):
        mensaje = dependencies.marcar_mensaje_leido().execute(mensaje_id)
        return Response(MensajeContactoSerializer(mensaje).data)


def _seccion_de(valor):
    if valor in (None, ""):
        return None
    try:
        return SeccionLanding(valor)
    except ValueError:
        raise serializers.ValidationError({"seccion": "Sección no válida."}) from None


class ElementoLandingListCreateView(APIView):
    """Contenido repetible de la página de inicio: lectura pública, edición del administrador."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [EsAdministrador()]

    def get(self, request):
        incluir_inactivos = _es_administrador(request) and request.query_params.get("todos") in ("1", "true")
        elementos = dependencies.listar_elementos().execute(
            _seccion_de(request.query_params.get("seccion")), incluir_inactivos
        )
        return Response(ElementoLandingSerializer(elementos, many=True).data)

    def post(self, request):
        serializer = ElementoLandingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        elemento = dependencies.crear_elemento().execute(DatosElemento(**serializer.validated_data))
        return Response(ElementoLandingSerializer(elemento).data, status=status.HTTP_201_CREATED)


class ElementoLandingDetailView(APIView):
    permission_classes = [EsAdministrador]

    def patch(self, request, elemento_id):
        serializer = ElementoLandingSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        elemento = dependencies.actualizar_elemento().execute(elemento_id, serializer.validated_data)
        return Response(ElementoLandingSerializer(elemento).data)

    def delete(self, request, elemento_id):
        dependencies.eliminar_elemento().execute(elemento_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ElementoLandingImagenView(APIView):
    """GET público (las imágenes de la página son públicas); subir o quitar, solo el administrador."""

    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [EsAdministrador()]

    def get(self, request, elemento_id):
        ruta = dependencies.obtener_ruta_imagen().execute(elemento_id, _es_administrador(request))
        content_type, _ = mimetypes.guess_type(ruta)
        respuesta = FileResponse(default_storage.open(ruta, "rb"), content_type=content_type or "image/jpeg")
        # La URL lleva la versión de la imagen, así que puede guardarse en caché mucho tiempo
        respuesta["Cache-Control"] = "public, max-age=31536000, immutable"
        return respuesta

    def post(self, request, elemento_id):
        serializer = ImagenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        elemento = dependencies.subir_imagen_elemento().execute(elemento_id, serializer.validated_data["imagen"])
        return Response(ElementoLandingSerializer(elemento).data)

    def delete(self, request, elemento_id):
        elemento = dependencies.quitar_imagen_elemento().execute(elemento_id)
        return Response(ElementoLandingSerializer(elemento).data)


class ImagenUnicaView(APIView):
    """Imagen de la portada, de "quiénes somos" o del enfoque."""

    permission_classes = [EsAdministrador]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, seccion):
        clave = _seccion_de(seccion)
        if clave not in SECCIONES_DE_IMAGEN_UNICA:
            raise serializers.ValidationError({"seccion": "Esta sección no es una imagen única."})
        serializer = ImagenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        elemento = dependencies.reemplazar_imagen_unica().execute(clave, serializer.validated_data["imagen"])
        return Response(ElementoLandingSerializer(elemento).data)
