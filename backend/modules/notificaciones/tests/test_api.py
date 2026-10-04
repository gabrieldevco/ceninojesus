from django.utils import timezone
from rest_framework.test import APITestCase

from modules.notificaciones.infrastructure.models import NotificacionModel
from shared.testing_api import crear_usuario


class NotificacionesApiTests(APITestCase):
    def setUp(self):
        self.usuario = crear_usuario("mama")
        self.notificacion = NotificacionModel.objects.create(
            usuario=self.usuario, titulo="Hola", mensaje="Prueba", fecha_creacion=timezone.now()
        )

    def test_listar_y_marcar_leida(self):
        self.client.force_authenticate(self.usuario)
        self.assertEqual(len(self.client.get("/api/notificaciones/?no_leidas=1").data), 1)
        self.client.post(f"/api/notificaciones/{self.notificacion.id}/leer/")
        self.assertEqual(self.client.get("/api/notificaciones/?no_leidas=1").data, [])

    def test_no_se_marcan_notificaciones_ajenas(self):
        self.client.force_authenticate(crear_usuario("papa"))
        response = self.client.post(f"/api/notificaciones/{self.notificacion.id}/leer/")
        self.assertEqual(response.status_code, 403)
