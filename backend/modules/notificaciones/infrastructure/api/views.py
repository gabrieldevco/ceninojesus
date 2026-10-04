from rest_framework.response import Response
from rest_framework.views import APIView

from modules.notificaciones.infrastructure import dependencies
from shared.infrastructure.permissions import actor_desde_request

from .serializers import NotificacionSerializer


class MisNotificacionesView(APIView):
    def get(self, request):
        solo_no_leidas = request.query_params.get("no_leidas") in ("1", "true")
        notificaciones = dependencies.listar_mis_notificaciones().execute(
            actor_desde_request(request), solo_no_leidas
        )
        return Response(NotificacionSerializer(notificaciones, many=True).data)


class MarcarLeidaView(APIView):
    def post(self, request, notificacion_id):
        notificacion = dependencies.marcar_notificacion_leida().execute(actor_desde_request(request), notificacion_id)
        return Response(NotificacionSerializer(notificacion).data)
