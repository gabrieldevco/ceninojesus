"""Adaptador de entrada HTTP: traduce peticiones REST a casos de uso."""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.interesados.application.use_cases import RegistrarInteresadoCommand
from modules.interesados.domain.entities import EstadoInteresado
from modules.interesados.infrastructure import dependencies
from shared.infrastructure.permissions import EsAdministrador, actor_desde_request
from shared.infrastructure.throttling import LimiteEnvios

from .serializers import (
    CambiarEstadoSerializer,
    InteresadoSerializer,
    RegistrarInteresadoSerializer,
    SeguimientoSerializer,
)


class InteresadoListCreateView(APIView):
    throttle_classes = [LimiteEnvios]
    throttle_scope = "formularios"

    def get_permissions(self):
        # El formulario público (RF-16) no requiere sesión; el listado sí
        if self.request.method == "POST":
            return [AllowAny()]
        return [EsAdministrador()]

    def get(self, request):
        estado = request.query_params.get("estado")
        interesados = dependencies.listar_interesados().execute(
            EstadoInteresado(estado) if estado in EstadoInteresado else None
        )
        return Response(InteresadoSerializer(interesados, many=True).data)

    def post(self, request):
        serializer = RegistrarInteresadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        interesado = dependencies.registrar_interesado().execute(
            RegistrarInteresadoCommand(**serializer.validated_data)
        )
        return Response(InteresadoSerializer(interesado).data, status=status.HTTP_201_CREATED)


class CambiarEstadoInteresadoView(APIView):
    permission_classes = [EsAdministrador]

    def patch(self, request, interesado_id):
        serializer = CambiarEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        interesado = dependencies.cambiar_estado_interesado().execute(
            interesado_id, EstadoInteresado(serializer.validated_data["estado"])
        )
        return Response(InteresadoSerializer(interesado).data)


class AnonimizarInteresadoView(APIView):
    """Ley 1581, derecho de supresión: lo ejecuta el administrador al atender la solicitud."""

    permission_classes = [EsAdministrador]

    def post(self, request, interesado_id):
        interesado = dependencies.anonimizar_interesado().execute(interesado_id)
        return Response(InteresadoSerializer(interesado).data)


class SeguimientosView(APIView):
    permission_classes = [EsAdministrador]

    def get(self, request, interesado_id):
        seguimientos = dependencies.listar_seguimientos().execute(interesado_id)
        return Response(SeguimientoSerializer(seguimientos, many=True).data)

    def post(self, request, interesado_id):
        serializer = SeguimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        seguimiento = dependencies.registrar_seguimiento().execute(
            actor_desde_request(request), interesado_id, serializer.validated_data["nota"]
        )
        return Response(SeguimientoSerializer(seguimiento).data, status=status.HTTP_201_CREATED)
