from dataclasses import asdict

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.institucional.application.use_cases import DatosEnlace, DatosMensaje
from modules.institucional.infrastructure import dependencies
from shared.infrastructure.permissions import EsAdministrador, actor_desde_request
from shared.infrastructure.throttling import LimiteEnvios

from .serializers import EnlaceSerializer, InformacionSerializer, MensajeContactoSerializer


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
