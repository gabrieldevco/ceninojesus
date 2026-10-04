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

from .serializers import SERIALIZERS


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
            content_type=content_type or "application/octet-stream",
        )
