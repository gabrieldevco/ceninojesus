"""Flujo completo de matrícula a grupos extracurriculares (RF-07 a RF-11)."""

from rest_framework.test import APITestCase

from modules.notificaciones.infrastructure.models import NotificacionModel
from modules.usuarios.infrastructure.models import EstudianteModel
from shared.domain.actor import Rol
from shared.testing_api import crear_usuario


class MatriculaApiTests(APITestCase):
    def setUp(self):
        self.admin = crear_usuario("rector", Rol.ADMINISTRADOR)
        self.profe = crear_usuario("profe_ajedrez", Rol.ADMINISTRADOR_GRUPO)
        self.otro_profe = crear_usuario("profe_robotica", Rol.ADMINISTRADOR_GRUPO)
        self.acudiente = crear_usuario("mama")
        self.otro_acudiente = crear_usuario("papa")
        self.hijo = EstudianteModel.objects.create(nombres="Luis", apellidos="Pérez", acudiente=self.acudiente)

        self.client.force_authenticate(self.admin)
        grupo = self.client.post("/api/grupos/", {"nombre": "Ajedrez avanzado", "cupo_maximo": 1}, format="json")
        self.assertEqual(grupo.status_code, 201)
        self.grupo_id = grupo.data["id"]
        asignacion = self.client.put(
            f"/api/grupos/{self.grupo_id}/administradores/", {"administrador_ids": [self.profe.id]}, format="json"
        )
        self.assertEqual(asignacion.data["administrador_ids"], [self.profe.id])
        self.client.force_authenticate(None)

    def solicitar(self, acudiente=None, estudiante_id=None):
        self.client.force_authenticate(acudiente or self.acudiente)
        return self.client.post(
            "/api/matriculas/",
            {"grupo_id": self.grupo_id, "estudiante_id": estudiante_id or self.hijo.id},
            format="json",
        )

    def test_grupos_activos_son_publicos(self):
        nombres = [g["nombre"] for g in self.client.get("/api/grupos/").data]
        self.assertIn("Ajedrez avanzado", nombres)

    def test_solicitud_notifica_al_administrador_del_grupo(self):
        response = self.solicitar()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["estado"], "pendiente")
        self.assertEqual(response.data["estudiante_nombre"], "Luis Pérez")
        self.assertTrue(NotificacionModel.objects.filter(usuario=self.profe).exists())

    def test_no_permite_solicitud_duplicada(self):
        self.solicitar()
        self.assertEqual(self.solicitar().status_code, 400)

    def test_no_permite_inscribir_hijos_ajenos(self):
        self.assertEqual(self.solicitar(acudiente=self.otro_acudiente).status_code, 400)

    def test_aprobacion_notifica_al_acudiente(self):
        solicitud_id = self.solicitar().data["id"]
        self.client.force_authenticate(self.profe)
        self.assertEqual(len(self.client.get("/api/matriculas/").data), 1)

        response = self.client.post(f"/api/matriculas/{solicitud_id}/aprobar/", {}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["estado"], "aprobada")
        self.assertTrue(NotificacionModel.objects.filter(usuario=self.acudiente, titulo__contains="aprobada").exists())

        inscritos = self.client.get(f"/api/grupos/{self.grupo_id}/inscritos/").data
        self.assertEqual([i["nombre_completo"] for i in inscritos], ["Luis Pérez"])

        self.client.force_authenticate(self.acudiente)
        self.assertEqual([g["id"] for g in self.client.get("/api/grupos/mis-grupos/").data], [self.grupo_id])

    def test_administrador_de_otro_grupo_no_puede_resolver(self):
        solicitud_id = self.solicitar().data["id"]
        self.client.force_authenticate(self.otro_profe)
        self.assertEqual(self.client.get("/api/matriculas/").data, [])
        response = self.client.post(f"/api/matriculas/{solicitud_id}/aprobar/", {}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_rechazo_exige_motivo(self):
        solicitud_id = self.solicitar().data["id"]
        self.client.force_authenticate(self.profe)
        url = f"/api/matriculas/{solicitud_id}/rechazar/"
        self.assertEqual(self.client.post(url, {"motivo": " "}, format="json").status_code, 400)
        response = self.client.post(url, {"motivo": "Horario lleno"}, format="json")
        self.assertEqual(response.data["estado"], "rechazada")

    def test_respeta_el_cupo(self):
        hermana = EstudianteModel.objects.create(nombres="Ana", apellidos="Pérez", acudiente=self.acudiente)
        primera = self.solicitar().data["id"]
        segunda = self.solicitar(estudiante_id=hermana.id).data["id"]
        self.client.force_authenticate(self.profe)
        self.client.post(f"/api/matriculas/{primera}/aprobar/", {}, format="json")
        response = self.client.post(f"/api/matriculas/{segunda}/aprobar/", {}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_solo_acudientes_solicitan(self):
        self.client.force_authenticate(self.profe)
        response = self.client.post(
            "/api/matriculas/", {"grupo_id": self.grupo_id, "estudiante_id": self.hijo.id}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_asignar_administrador_sin_rol_correcto(self):
        self.client.force_authenticate(self.admin)
        response = self.client.put(
            f"/api/grupos/{self.grupo_id}/administradores/", {"administrador_ids": [self.acudiente.id]}, format="json"
        )
        self.assertEqual(response.status_code, 400)
