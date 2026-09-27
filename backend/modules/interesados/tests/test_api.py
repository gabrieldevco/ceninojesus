"""Pruebas de integración: API + casos de uso + repositorio Django."""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

URL = "/api/interesados/"

DATOS = {
    "nombre_completo": "Ana Pérez",
    "email": "ana@example.com",
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
        self.assertEqual(self.client.get(URL).status_code, 403)

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
