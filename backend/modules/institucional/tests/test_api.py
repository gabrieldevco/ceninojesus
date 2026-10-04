"""Sitio institucional, portal de acceso y contacto (RF-01 a RF-05)."""

from rest_framework.test import APITestCase

from modules.institucional.infrastructure.models import EnlacePortalModel
from modules.notificaciones.infrastructure.models import NotificacionModel
from shared.domain.actor import Rol
from shared.testing_api import crear_usuario


class InstitucionalApiTests(APITestCase):
    def setUp(self):
        self.admin = crear_usuario("rector", Rol.ADMINISTRADOR)

    def test_informacion_publica_con_datos_iniciales(self):
        response = self.client.get("/api/institucional/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["nombre"], "Centro Educativo El Niño Jesús")

    def test_solo_el_administrador_edita_la_informacion(self):
        self.assertEqual(self.client.patch("/api/institucional/", {"mision": "X"}).status_code, 401)
        self.client.force_authenticate(self.admin)
        response = self.client.patch("/api/institucional/", {"mision": "Formar personas íntegras."})
        self.assertEqual(response.data["mision"], "Formar personas íntegras.")
        self.assertEqual(response.data["nombre"], "Centro Educativo El Niño Jesús")

    def test_enlaces_restringidos_solo_para_autenticados(self):
        EnlacePortalModel.objects.create(nombre="Biblioteca", url="https://biblio.example.com", tipo="biblioteca")
        EnlacePortalModel.objects.create(
            nombre="Notas", url="https://notas.example.com", tipo="sistema_administrativo", requiere_autenticacion=True
        )
        self.assertEqual([e["nombre"] for e in self.client.get("/api/institucional/enlaces/").data], ["Biblioteca"])

        self.client.force_authenticate(crear_usuario("mama"))
        self.assertEqual(len(self.client.get("/api/institucional/enlaces/").data), 2)

    def test_contacto_publico_notifica_administradores(self):
        mensaje = {
            "nombre": "Pedro",
            "correo": "pedro@example.com",
            "asunto": "Costos",
            "mensaje": "¿Cuál es el valor de la pensión?",
            "autoriza_tratamiento_datos": True,
        }
        self.assertEqual(self.client.post("/api/institucional/contacto/", mensaje).status_code, 201)
        self.assertTrue(NotificacionModel.objects.filter(usuario=self.admin).exists())

        sin_autorizacion = {**mensaje, "autoriza_tratamiento_datos": False}
        self.assertEqual(self.client.post("/api/institucional/contacto/", sin_autorizacion).status_code, 400)
