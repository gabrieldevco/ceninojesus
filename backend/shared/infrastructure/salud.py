"""Chequeo de salud para Docker: responde 200 si la aplicación y la base de datos están disponibles."""

from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class SaludView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        connection.ensure_connection()
        return Response({"estado": "ok"})
