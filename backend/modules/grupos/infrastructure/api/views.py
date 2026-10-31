from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.grupos.application.use_cases import DatosGrupo
from modules.grupos.domain.entities import EstadoSolicitud
from modules.grupos.infrastructure import dependencies
from shared.domain.actor import Rol
from shared.infrastructure.permissions import (
    EsAdministrador,
    EsGestorDeGrupos,
    actor_desde_request,
    roles_permitidos,
)

from . import serializers as s


class GrupoListCreateView(APIView):
    """Listado público de grupos activos (para que los padres elijan); el administrador los crea."""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [EsAdministrador()]

    def get(self, request):
        # El administrador puede pedir también los grupos inactivos (`?todos=true`) para gestionarlos
        es_administrador = request.user.is_authenticated and actor_desde_request(request).es_administrador
        solo_activos = not (es_administrador and request.query_params.get("todos") == "true")
        grupos = dependencies.listar_grupos().execute(solo_activos=solo_activos)
        return Response(s.GrupoSerializer(grupos, many=True).data)

    def post(self, request):
        serializer = s.GrupoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        grupo = dependencies.crear_grupo().execute(DatosGrupo(**serializer.validated_data))
        return Response(s.GrupoSerializer(grupo).data, status=status.HTTP_201_CREATED)


class GrupoDetailView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [EsGestorDeGrupos()]

    def get(self, request, grupo_id):
        return Response(s.GrupoSerializer(dependencies.obtener_grupo().execute(grupo_id)).data)

    def patch(self, request, grupo_id):
        serializer = s.GrupoSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        grupo = dependencies.actualizar_grupo().execute(
            actor_desde_request(request), grupo_id, serializer.validated_data
        )
        return Response(s.GrupoSerializer(grupo).data)


class AdministradoresGrupoView(APIView):
    permission_classes = [EsAdministrador]

    def put(self, request, grupo_id):
        serializer = s.AsignarAdministradoresSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        grupo = dependencies.asignar_administradores().execute(grupo_id, serializer.validated_data["administrador_ids"])
        return Response(s.GrupoSerializer(grupo).data)


class MisGruposView(APIView):
    def get(self, request):
        grupos = dependencies.mis_grupos().execute(actor_desde_request(request))
        return Response(s.GrupoSerializer(grupos, many=True).data)


class InscritosView(APIView):
    permission_classes = [EsGestorDeGrupos]

    def get(self, request, grupo_id):
        inscritos = dependencies.listar_inscritos().execute(actor_desde_request(request), grupo_id)
        return Response(s.InscritoSerializer(inscritos, many=True).data)


class SolicitudListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [roles_permitidos(Rol.ACUDIENTE)()]
        return super().get_permissions()

    def get(self, request):
        estado = request.query_params.get("estado")
        grupo_id = request.query_params.get("grupo")
        solicitudes = dependencies.listar_solicitudes().execute(
            actor_desde_request(request),
            EstadoSolicitud(estado) if estado in s.ESTADOS else None,
            int(grupo_id) if grupo_id and grupo_id.isdigit() else None,
        )
        return Response(s.SolicitudSerializer(solicitudes, many=True).data)

    def post(self, request):
        serializer = s.CrearSolicitudSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        solicitud = dependencies.solicitar_matricula().execute(
            actor_desde_request(request), **serializer.validated_data
        )
        return Response(s.SolicitudSerializer(solicitud).data, status=status.HTTP_201_CREATED)


class AprobarSolicitudView(APIView):
    permission_classes = [EsGestorDeGrupos]

    def post(self, request, solicitud_id):
        serializer = s.AprobarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        solicitud = dependencies.aprobar_solicitud().execute(
            actor_desde_request(request), solicitud_id, serializer.validated_data["respuesta"]
        )
        return Response(s.SolicitudSerializer(solicitud).data)


class RechazarSolicitudView(APIView):
    permission_classes = [EsGestorDeGrupos]

    def post(self, request, solicitud_id):
        serializer = s.RechazarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        solicitud = dependencies.rechazar_solicitud().execute(
            actor_desde_request(request), solicitud_id, serializer.validated_data["motivo"]
        )
        return Response(s.SolicitudSerializer(solicitud).data)
