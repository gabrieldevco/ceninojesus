"""Adaptador de entrada HTTP: traduce peticiones REST a casos de uso."""

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.interesados.application.use_cases import RegistrarInteresadoCommand
from modules.interesados.domain.entities import EstadoInteresado
from modules.interesados.infrastructure import dependencies

from .serializers import CambiarEstadoSerializer, InteresadoSerializer, RegistrarInteresadoSerializer


class InteresadoListCreateView(APIView):
    def get_permissions(self):
        # El formulario público (RF-16) no requiere sesión; el listado sí
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAdminUser()]

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
    permission_classes = [IsAdminUser]

    def patch(self, request, interesado_id):
        serializer = CambiarEstadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        interesado = dependencies.cambiar_estado_interesado().execute(
            interesado_id, EstadoInteresado(serializer.validated_data["estado"])
        )
        return Response(InteresadoSerializer(interesado).data)
