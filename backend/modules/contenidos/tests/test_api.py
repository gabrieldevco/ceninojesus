"""Contenido por grupo y acceso restringido a estudiantes aprobados (RF-12 a RF-15)."""

import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from modules.grupos.infrastructure.models import (
    GrupoAdministradorModel,
    GrupoExtracurricularModel,
    SolicitudMatriculaModel,
)
from modules.usuarios.infrastructure.models import EstudianteModel
from shared.domain.actor import Rol
from shared.testing_api import crear_usuario

MEDIA_TEMPORAL = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA_TEMPORAL)
class ContenidoApiTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TEMPORAL, ignore_errors=True)

    def setUp(self):
        self.profe = crear_usuario("profe", Rol.ADMINISTRADOR_GRUPO)
        acudiente = crear_usuario("mama")
        self.grupo = GrupoExtracurricularModel.objects.create(nombre="Robótica junior")
        GrupoAdministradorModel.objects.create(grupo=self.grupo, usuario=self.profe)

        self.estudiante = crear_usuario("luis", Rol.ESTUDIANTE)
        hijo = EstudianteModel.objects.create(
            nombres="Luis", apellidos="Pérez", acudiente=acudiente, usuario=self.estudiante
        )
        SolicitudMatriculaModel.objects.create(
            grupo=self.grupo,
            estudiante=hijo,
            acudiente=acudiente,
            estado="aprobada",
            fecha_solicitud="2026-10-01T00:00Z",
        )

        self.no_inscrito = crear_usuario("pedro", Rol.ESTUDIANTE)
        EstudianteModel.objects.create(
            nombres="Pedro", apellidos="Gómez", acudiente=acudiente, usuario=self.no_inscrito
        )

        self.url = f"/api/grupos/{self.grupo.id}/materiales/"

    def publicar(self, **datos):
        self.client.force_authenticate(self.profe)
        return self.client.post(self.url, datos, format="multipart")

    def test_administrador_publica_material_con_archivo(self):
        archivo = SimpleUploadedFile("guia.pdf", b"%PDF-1.4 contenido", content_type="application/pdf")
        response = self.publicar(titulo="Guía 1", tipo="documento", archivo=archivo)
        self.assertEqual(response.status_code, 201)
        self.assertIn("/archivo/", response.data["archivo_url"])

    def test_material_sin_archivo_ni_enlace_es_invalido(self):
        self.assertEqual(self.publicar(titulo="Vacío", tipo="documento").status_code, 400)

    def test_estudiante_aprobado_ve_y_descarga(self):
        archivo = SimpleUploadedFile("guia.pdf", b"%PDF-1.4 contenido", content_type="application/pdf")
        material_id = self.publicar(titulo="Guía 1", tipo="documento", archivo=archivo).data["id"]
        self.publicar(titulo="Borrador", tipo="enlace", url="https://example.com", publicado=False)

        self.client.force_authenticate(self.estudiante)
        titulos = [m["titulo"] for m in self.client.get(self.url).data]
        self.assertEqual(titulos, ["Guía 1"])  # el borrador no se muestra

        descarga = self.client.get(f"{self.url}{material_id}/archivo/")
        self.assertEqual(descarga.status_code, 200)
        self.assertEqual(b"".join(descarga.streaming_content), b"%PDF-1.4 contenido")

    def test_estudiante_no_inscrito_no_accede(self):
        archivo = SimpleUploadedFile("guia.pdf", b"%PDF-1.4", content_type="application/pdf")
        material_id = self.publicar(titulo="Guía 1", tipo="documento", archivo=archivo).data["id"]

        self.client.force_authenticate(self.no_inscrito)
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.assertEqual(self.client.get(f"{self.url}{material_id}/archivo/").status_code, 403)

    def test_estudiante_no_puede_publicar(self):
        self.client.force_authenticate(self.estudiante)
        response = self.client.post(self.url, {"titulo": "X", "url": "https://example.com"}, format="multipart")
        self.assertEqual(response.status_code, 403)

    def test_actividades(self):
        self.client.force_authenticate(self.profe)
        url = f"/api/grupos/{self.grupo.id}/actividades/"
        response = self.client.post(
            url, {"titulo": "Armar un robot", "fecha_entrega": "2026-11-01T17:00:00Z"}, format="multipart"
        )
        self.assertEqual(response.status_code, 201)

        self.client.force_authenticate(self.estudiante)
        self.assertEqual(len(self.client.get(url).data), 1)

    def subir(self, nombre, contenido, **extra):
        return self.publicar(titulo="Archivo", tipo="documento", archivo=SimpleUploadedFile(nombre, contenido), **extra)

    def test_rechaza_extension_no_permitida(self):
        self.assertEqual(self.subir("virus.exe", b"MZ").status_code, 400)
        self.assertEqual(self.subir("pagina.html", b"<script>alert(1)</script>").status_code, 400)

    def test_rechaza_contenido_que_no_corresponde_a_la_extension(self):
        self.assertEqual(self.subir("falso.pdf", b"<script>alert(1)</script>").status_code, 400)

    def test_rechaza_archivo_demasiado_grande(self):
        with self.settings(ARCHIVO_MAX_MB=1):
            self.assertEqual(self.subir("grande.pdf", b"%PDF-" + b"0" * (1024 * 1024)).status_code, 400)

    def test_la_descarga_siempre_es_adjunto(self):
        material_id = self.subir("guia.pdf", b"%PDF-1.4 contenido").data["id"]
        descarga = self.client.get(f"{self.url}{material_id}/archivo/")
        self.assertEqual(descarga.status_code, 200)
        self.assertTrue(descarga["Content-Disposition"].startswith("attachment"))
