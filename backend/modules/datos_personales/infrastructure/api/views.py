from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.datos_personales.application.use_cases import DatosSolicitud
from modules.datos_personales.domain.entities import EstadoSolicitudDatos
from modules.datos_personales.infrastructure import dependencies
from shared.infrastructure.permissions import EsAdministrador, actor_desde_request
from shared.infrastructure.throttling import LimiteEnvios

from .serializers import ESTADOS, ResponderSerializer, SolicitudDatosSerializer


class SolicitudDatosListCreateView(APIView):
    """Cualquier titular radica su solicitud (con o sin cuenta); el administrador las gestiona."""

    throttle_classes = [LimiteEnvios]
    throttle_scope = "formularios"

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "POST" else [EsAdministrador()]

    def get(self, request):
        estado = request.query_params.get("estado")
        solicitudes = dependencies.listar_solicitudes().execute(
            EstadoSolicitudDatos(estado) if estado in ESTADOS else None
        )
        return Response(SolicitudDatosSerializer(solicitudes, many=True).data)

    def post(self, request):
        serializer = SolicitudDatosSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario_id = request.user.id if request.user.is_authenticated else None
        solicitud = dependencies.radicar_solicitud().execute(DatosSolicitud(**serializer.validated_data), usuario_id)
        return Response(SolicitudDatosSerializer(solicitud).data, status=status.HTTP_201_CREATED)


class TramitarSolicitudDatosView(APIView):
    permission_classes = [EsAdministrador]

    def post(self, request, solicitud_id):
        solicitud = dependencies.tramitar_solicitud().execute(actor_desde_request(request), solicitud_id)
        return Response(SolicitudDatosSerializer(solicitud).data)


class ResponderSolicitudDatosView(APIView):
    permission_classes = [EsAdministrador]

    def post(self, request, solicitud_id):
        serializer = ResponderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        solicitud = dependencies.responder_solicitud().execute(
            actor_desde_request(request), solicitud_id, serializer.validated_data["respuesta"]
        )
        return Response(SolicitudDatosSerializer(solicitud).data)
