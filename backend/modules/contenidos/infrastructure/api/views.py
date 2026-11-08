"""
Vistas de materiales y actividades. `tipo` se fija en urls.py
("materiales" o "actividades") y selecciona repositorio y serializer.
"""

import mimetypes

from django.core.files.storage import default_storage
from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.contenidos.infrastructure import dependencies
from shared.infrastructure.permissions import actor_desde_request

from .serializers import SERIALIZERS, CalificacionSerializer, NuevaEntregaSerializer, entrega_a_dict


class _ContenidoView(APIView):
    tipo = None

    def _serializer(self, *args, **kwargs):
        return SERIALIZERS[self.tipo](*args, context={"request": self.request}, **kwargs)

    def _datos_validos(self, partial=False):
        serializer = self._serializer(data=self.request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        datos = dict(serializer.validated_data)
        return datos, datos.pop("archivo", None)


class ContenidoListCreateView(_ContenidoView):
    def get(self, request, grupo_id):
        contenidos = dependencies.listar(self.tipo).execute(actor_desde_request(request), grupo_id)
        return Response(self._serializer(contenidos, many=True).data)

    def post(self, request, grupo_id):
        datos, archivo = self._datos_validos()
        contenido = dependencies.crear(self.tipo).execute(actor_desde_request(request), grupo_id, datos, archivo)
        return Response(self._serializer(contenido).data, status=status.HTTP_201_CREATED)


class ContenidoDetailView(_ContenidoView):
    def get(self, request, grupo_id, contenido_id):
        contenido = dependencies.obtener(self.tipo).execute(actor_desde_request(request), grupo_id, contenido_id)
        return Response(self._serializer(contenido).data)

    def patch(self, request, grupo_id, contenido_id):
        datos, archivo = self._datos_validos(partial=True)
        contenido = dependencies.actualizar(self.tipo).execute(
            actor_desde_request(request), grupo_id, contenido_id, datos, archivo
        )
        return Response(self._serializer(contenido).data)

    def delete(self, request, grupo_id, contenido_id):
        dependencies.eliminar(self.tipo).execute(actor_desde_request(request), grupo_id, contenido_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContenidoArchivoView(_ContenidoView):
    """Descarga protegida: el archivo solo se entrega a quien puede ver el contenido."""

    def get(self, request, grupo_id, contenido_id):
        ruta = dependencies.obtener_archivo(self.tipo).execute(actor_desde_request(request), grupo_id, contenido_id)
        content_type, _ = mimetypes.guess_type(ruta)
        return FileResponse(
            default_storage.open(ruta, "rb"),
            filename=ruta.rsplit("/", 1)[-1],
            as_attachment=True,  # nunca se muestra en línea: evita ejecutar HTML o scripts subidos
            content_type=content_type or "application/octet-stream",
        )


def _descargar(ruta: str) -> FileResponse:
    content_type, _ = mimetypes.guess_type(ruta)
    return FileResponse(
        default_storage.open(ruta, "rb"),
        filename=ruta.rsplit("/", 1)[-1],
        as_attachment=True,
        content_type=content_type or "application/octet-stream",
    )


class MiEntregaView(APIView):
    """GET: la entrega del estudiante en la actividad (o null). POST: entrega o reemplaza el trabajo."""

    def get(self, request, grupo_id, contenido_id):
        item = dependencies.mi_entrega().execute(actor_desde_request(request), grupo_id, contenido_id)
        return Response(entrega_a_dict(item, grupo_id, request) if item else None)

    def post(self, request, grupo_id, contenido_id):
        serializer = NuevaEntregaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = dict(serializer.validated_data)
        archivo = datos.pop("archivo", None)
        item = dependencies.entregar_actividad().execute(
            actor_desde_request(request), grupo_id, contenido_id, datos, archivo
        )
        return Response(entrega_a_dict(item, grupo_id, request), status=status.HTTP_201_CREATED)


class MisEntregasView(APIView):
    def get(self, request, grupo_id):
        items = dependencies.mis_entregas().execute(actor_desde_request(request), grupo_id)
        return Response([entrega_a_dict(i, grupo_id, request) for i in items])


class EntregasDeActividadView(APIView):
    def get(self, request, grupo_id, contenido_id):
        items = dependencies.listar_entregas().execute(actor_desde_request(request), grupo_id, contenido_id)
        return Response([entrega_a_dict(i, grupo_id, request) for i in items])


class CalificarEntregaView(APIView):
    def post(self, request, grupo_id, contenido_id, entrega_id):
        serializer = CalificacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = dependencies.calificar_entrega().execute(
            actor_desde_request(request),
            grupo_id,
            contenido_id,
            entrega_id,
            serializer.validated_data["calificacion"],
            serializer.validated_data["comentario"],
        )
        return Response(entrega_a_dict(item, grupo_id, request))


class ArchivoEntregaView(APIView):
    def get(self, request, grupo_id, contenido_id, entrega_id):
        ruta = dependencies.archivo_entrega().execute(actor_desde_request(request), grupo_id, contenido_id, entrega_id)
        return _descargar(ruta)
