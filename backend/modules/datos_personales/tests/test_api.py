"""Derechos de los titulares (Ley 1581): radicación, respuesta y alertas de vencimiento."""

from datetime import timedelta
from io import StringIO

from django.core import mail
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from modules.datos_personales.infrastructure.models import SolicitudDatosModel
from modules.notificaciones.infrastructure.models import NotificacionModel
from shared.domain.actor import Rol
from shared.testing_api import crear_usuario

SOLICITUD = {
    "nombre": "Pedro Gómez",
    "correo": "pedro@example.com",
    "tipo": "supresion",
    "descripcion": "Llené el formulario de interés y quiero que borren mis datos.",
}
URL = "/api/datos-personales/solicitudes/"


class SolicitudesDatosApiTests(APITestCase):
    def setUp(self):
        self.admin = crear_usuario("rector", Rol.ADMINISTRADOR)

    def test_radicar_envia_acuse_y_avisa_administradores(self):
        response = self.client.post(URL, SOLICITUD)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["estado"], "recibida")
        self.assertIsNotNone(response.data["fecha_limite"])

        acuses = [m for m in mail.outbox if "pedro@example.com" in m.to]
        self.assertEqual(len(acuses), 1)
        self.assertIn(f"Radicado No. {response.data['id']}", acuses[0].subject)
        self.assertTrue(NotificacionModel.objects.filter(usuario=self.admin).exists())

    def test_responder_envia_la_respuesta_al_titular(self):
        solicitud_id = self.client.post(URL, SOLICITUD).data["id"]
        mail.outbox.clear()
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"{URL}{solicitud_id}/responder/", {"respuesta": "Sus datos fueron suprimidos."})
        self.assertEqual(response.data["estado"], "resuelta")
        self.assertEqual(mail.outbox[0].to, ["pedro@example.com"])
        self.assertIn("Sus datos fueron suprimidos.", mail.outbox[0].body)

    def test_solo_el_administrador_ve_las_solicitudes(self):
        self.client.post(URL, SOLICITUD)
        self.assertEqual(self.client.get(URL).status_code, 401)
        self.client.force_authenticate(crear_usuario("mama"))
        self.assertEqual(self.client.get(URL).status_code, 403)

    def test_comando_alerta_solicitudes_por_vencer(self):
        self.client.post(URL, SOLICITUD)
        SolicitudDatosModel.objects.update(fecha_limite=timezone.localdate() + timedelta(days=1))
        NotificacionModel.objects.all().delete()

        call_command("alertar_solicitudes_datos", stdout=StringIO())
        call_command("alertar_solicitudes_datos", stdout=StringIO())  # mismo día: no repite
        self.assertEqual(NotificacionModel.objects.filter(titulo__contains="por vencer").count(), 1)


class PoliticaDatosTests(APITestCase):
    def test_politica_publica_con_borrador(self):
        response = self.client.get("/api/institucional/politica-datos/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("BORRADOR", response.data["politica"])
