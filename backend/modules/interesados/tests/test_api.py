"""Pruebas de integración: API + casos de uso + repositorio Django."""

from datetime import timedelta
from io import StringIO
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from modules.interesados.infrastructure.models import InteresadoModel
from modules.notificaciones.infrastructure.models import NotificacionModel

URL = "/api/interesados/"

DATOS = {
    "nombre_completo": "Ana Pérez",
    "correo": "ana@example.com",
    "telefono": "3000000000",
    "autoriza_tratamiento_datos": True,
}


class InteresadosApiTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_superuser("admin", "admin@example.com", "clave-segura-123")

    def test_registro_publico(self):
        response = self.client.post(URL, DATOS, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["estado"], "nuevo")

    def test_registro_sin_autorizacion_de_datos(self):
        response = self.client.post(URL, {**DATOS, "autoriza_tratamiento_datos": False}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_listado_requiere_administrador(self):
        self.assertEqual(self.client.get(URL).status_code, 401)

    def test_administrador_cambia_estado(self):
        interesado_id = self.client.post(URL, DATOS, format="json").data["id"]
        self.client.force_authenticate(self.admin)

        response = self.client.patch(f"{URL}{interesado_id}/estado/", {"estado": "en_seguimiento"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["estado"], "en_seguimiento")

        listado = self.client.get(URL, {"estado": "en_seguimiento"})
        self.assertEqual(len(listado.data), 1)

    def test_transicion_invalida_devuelve_400(self):
        interesado_id = self.client.post(URL, DATOS, format="json").data["id"]
        self.client.force_authenticate(self.admin)
        self.client.patch(f"{URL}{interesado_id}/estado/", {"estado": "descartado"}, format="json")

        response = self.client.patch(f"{URL}{interesado_id}/estado/", {"estado": "nuevo"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_interesado_inexistente_devuelve_404(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(f"{URL}999/estado/", {"estado": "descartado"}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_seguimiento_pasa_a_en_seguimiento(self):
        interesado_id = self.client.post(URL, DATOS, format="json").data["id"]
        self.client.force_authenticate(self.admin)
        url = f"{URL}{interesado_id}/seguimientos/"

        response = self.client.post(url, {"nota": "Se llamó, pide visita guiada."}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(self.client.get(url).data), 1)
        self.assertEqual(self.client.get(URL).data[0]["estado"], "en_seguimiento")

    def test_anonimizar_borra_datos_y_seguimientos(self):
        interesado_id = self.client.post(URL, DATOS, format="json").data["id"]
        self.client.force_authenticate(self.admin)
        self.client.post(f"{URL}{interesado_id}/seguimientos/", {"nota": "Llamó Ana"}, format="json")

        response = self.client.post(f"{URL}{interesado_id}/anonimizar/")
        self.assertEqual(response.data["nombre_completo"], "Anónimo")
        self.assertEqual((response.data["correo"], response.data["telefono"]), ("", ""))
        self.assertEqual(response.data["estado"], "descartado")
        self.assertEqual(self.client.get(f"{URL}{interesado_id}/seguimientos/").data, [])

    def test_limite_de_envios_del_formulario_publico(self):
        with mock.patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"formularios": "2/hour"}):
            codigos = [self.client.post(URL, DATOS, format="json").status_code for _ in range(3)]
            # El listado del administrador no se limita
            self.client.force_authenticate(self.admin)
            self.assertEqual(self.client.get(URL).status_code, 200)
        self.assertEqual(codigos, [201, 201, 429])


class RecordatoriosComandoTests(APITestCase):
    def test_comando_notifica_interesados_sin_respuesta(self):
        admin = get_user_model().objects.create_superuser("admin", "admin@example.com", "clave-segura-123")
        self.client.post(URL, DATOS, format="json")
        InteresadoModel.objects.update(fecha_registro=timezone.now() - timedelta(days=5))
        NotificacionModel.objects.all().delete()

        salida = StringIO()
        call_command("enviar_recordatorios_interesados", "--dias", "3", stdout=salida)
        self.assertIn("1 interesado", salida.getvalue())
        self.assertTrue(NotificacionModel.objects.filter(usuario=admin, titulo__contains="sin respuesta").exists())

        # Una segunda ejecución inmediata no repite el aviso
        call_command("enviar_recordatorios_interesados", "--dias", "3", stdout=StringIO())
        self.assertEqual(NotificacionModel.objects.filter(titulo__contains="sin respuesta").count(), 1)
