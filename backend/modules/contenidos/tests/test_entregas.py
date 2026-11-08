"""Entregas de actividades: el estudiante entrega y el docente califica y comenta."""

import shutil
import tempfile
from datetime import UTC, datetime, timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from modules.contenidos.infrastructure.models import ActividadModel
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
class EntregasApiTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TEMPORAL, ignore_errors=True)

    def setUp(self):
        self.profe = crear_usuario("profe", Rol.ADMINISTRADOR_GRUPO)
        self.otro_profe = crear_usuario("otroprofe", Rol.ADMINISTRADOR_GRUPO)
        acudiente = crear_usuario("mama")
        self.grupo = GrupoExtracurricularModel.objects.create(nombre="Robótica junior")
        GrupoAdministradorModel.objects.create(grupo=self.grupo, usuario=self.profe)

        self.estudiante = crear_usuario("luis", Rol.ESTUDIANTE, nombres="Luis", apellidos="Pérez")
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
        self.companero = crear_usuario("ana", Rol.ESTUDIANTE)
        hija = EstudianteModel.objects.create(
            nombres="Ana", apellidos="Ruiz", acudiente=acudiente, usuario=self.companero
        )
        SolicitudMatriculaModel.objects.create(
            grupo=self.grupo,
            estudiante=hija,
            acudiente=acudiente,
            estado="aprobada",
            fecha_solicitud="2026-10-01T00:00Z",
        )
        self.no_inscrito = crear_usuario("pedro", Rol.ESTUDIANTE)
        EstudianteModel.objects.create(
            nombres="Pedro", apellidos="Gómez", acudiente=acudiente, usuario=self.no_inscrito
        )

        self.actividad = ActividadModel.objects.create(
            grupo=self.grupo,
            titulo="Arma tu primer robot",
            autor=self.profe,
            fecha_publicacion=datetime.now(UTC),
            fecha_entrega=datetime.now(UTC) + timedelta(days=3),
        )
        self.base = f"/api/grupos/{self.grupo.id}/actividades/{self.actividad.id}"

    def entregar(self, usuario, **datos):
        self.client.force_authenticate(usuario)
        return self.client.post(f"{self.base}/entrega/", datos, format="multipart")

    def test_estudiante_entrega_con_archivo_y_lo_ve(self):
        archivo = SimpleUploadedFile("robot.pdf", b"%PDF-1.4 mi robot", content_type="application/pdf")
        response = self.entregar(self.estudiante, texto="Adjunto mi robot", archivo=archivo)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["texto"], "Adjunto mi robot")
        self.assertEqual(response.data["archivo_nombre"], "robot.pdf")
        self.assertFalse(response.data["tarde"])
        self.assertIsNone(response.data["calificacion"])

        mia = self.client.get(f"{self.base}/entrega/")
        self.assertEqual(mia.data["id"], response.data["id"])
        descarga = self.client.get(response.data["archivo_url"])
        self.assertEqual(descarga.status_code, 200)

        resumen = self.client.get(f"/api/grupos/{self.grupo.id}/actividades/mis-entregas/")
        self.assertEqual([e["actividad_id"] for e in resumen.data], [self.actividad.id])

    def test_sin_entrega_devuelve_null(self):
        self.client.force_authenticate(self.estudiante)
        self.assertIsNone(self.client.get(f"{self.base}/entrega/").data)

    def test_entrega_vacia_es_rechazada(self):
        response = self.entregar(self.estudiante, texto="   ")
        self.assertEqual(response.status_code, 400)

    def test_reentregar_reemplaza_mientras_no_este_calificada(self):
        primera = self.entregar(self.estudiante, texto="Borrador")
        segunda = self.entregar(self.estudiante, url="https://example.com/mi-robot")
        self.assertEqual(primera.data["id"], segunda.data["id"])
        self.assertEqual(segunda.data["url"], "https://example.com/mi-robot")
        self.assertEqual(segunda.data["texto"], "")

    def test_estudiante_no_inscrito_ni_docente_pueden_entregar(self):
        self.assertEqual(self.entregar(self.no_inscrito, texto="hola").status_code, 403)
        self.assertEqual(self.entregar(self.profe, texto="hola").status_code, 403)

    def test_no_se_entrega_una_actividad_en_borrador(self):
        self.actividad.publicado = False
        self.actividad.save()
        self.assertEqual(self.entregar(self.estudiante, texto="hola").status_code, 404)

    def test_entrega_despues_de_la_fecha_limite_queda_marcada_tarde(self):
        self.actividad.fecha_entrega = datetime.now(UTC) - timedelta(days=1)
        self.actividad.save()
        self.assertTrue(self.entregar(self.estudiante, texto="Perdón la demora").data["tarde"])

    def test_docente_lista_califica_y_comenta(self):
        entrega = self.entregar(self.estudiante, texto="Mi robot").data
        self.entregar(self.companero, texto="El mío")

        self.client.force_authenticate(self.profe)
        listado = self.client.get(f"{self.base}/entregas/")
        self.assertEqual(listado.status_code, 200)
        self.assertEqual({e["estudiante_nombre"] for e in listado.data}, {"Luis Pérez", "ana"})

        calificada = self.client.post(
            f"{self.base}/entregas/{entrega['id']}/calificar/",
            {"calificacion": "4.5", "comentario": "Muy buen trabajo"},
            format="json",
        )
        self.assertEqual(calificada.status_code, 200, calificada.data)
        self.assertEqual(calificada.data["calificacion"], "4.5")
        self.assertEqual(calificada.data["comentario_docente"], "Muy buen trabajo")

        # El estudiante ve la nota y ya no puede cambiar la entrega
        self.client.force_authenticate(self.estudiante)
        self.assertEqual(self.client.get(f"{self.base}/entrega/").data["calificacion"], "4.5")
        self.assertEqual(self.entregar(self.estudiante, texto="Otra versión").status_code, 400)

    def test_calificacion_fuera_de_rango_es_rechazada(self):
        entrega = self.entregar(self.estudiante, texto="Mi robot").data
        self.client.force_authenticate(self.profe)
        response = self.client.post(
            f"{self.base}/entregas/{entrega['id']}/calificar/", {"calificacion": "6"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_otro_docente_y_estudiantes_no_ven_ni_califican_entregas(self):
        entrega = self.entregar(self.estudiante, texto="Mi robot").data
        for usuario in (self.otro_profe, self.estudiante):
            self.client.force_authenticate(usuario)
            self.assertEqual(self.client.get(f"{self.base}/entregas/").status_code, 403)
            calificar = self.client.post(
                f"{self.base}/entregas/{entrega['id']}/calificar/", {"calificacion": "5.0"}, format="json"
            )
            self.assertEqual(calificar.status_code, 403)

    def test_un_companero_no_descarga_el_archivo_de_otro(self):
        archivo = SimpleUploadedFile("robot.pdf", b"%PDF-1.4 mi robot", content_type="application/pdf")
        entrega = self.entregar(self.estudiante, archivo=archivo).data
        self.client.force_authenticate(self.companero)
        self.assertEqual(self.client.get(entrega["archivo_url"]).status_code, 403)
        self.client.force_authenticate(self.profe)
        self.assertEqual(self.client.get(entrega["archivo_url"]).status_code, 200)


class DocenteCreaSuGrupoTests(APITestCase):
    def test_docente_crea_su_clase_y_queda_como_su_docente(self):
        profe = crear_usuario("profe", Rol.ADMINISTRADOR_GRUPO)
        self.client.force_authenticate(profe)
        response = self.client.post("/api/grupos/", {"nombre": "Matemáticas 5°"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["administrador_ids"], [profe.id])
        mis = self.client.get("/api/grupos/mis-grupos/")
        self.assertIn("Matemáticas 5°", [g["nombre"] for g in mis.data])

    def test_acudiente_y_estudiante_no_crean_grupos(self):
        for rol in (Rol.ACUDIENTE, Rol.ESTUDIANTE):
            self.client.force_authenticate(crear_usuario(f"u-{rol}", rol))
            self.assertEqual(
                self.client.post("/api/grupos/", {"nombre": f"Clase {rol}"}, format="json").status_code, 403
            )
