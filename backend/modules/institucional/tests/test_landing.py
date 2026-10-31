"""Contenido editable de la página de inicio (RF-01): textos, listas e imágenes."""

import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from modules.institucional.infrastructure.models import ElementoLandingModel
from shared.domain.actor import Rol
from shared.testing_api import crear_usuario

MEDIA_TEMPORAL = tempfile.mkdtemp()
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
URL = "/api/institucional/elementos/"


def imagen(nombre="foto.png", contenido=PNG):
    return {"imagen": SimpleUploadedFile(nombre, contenido, content_type="image/png")}


@override_settings(MEDIA_ROOT=MEDIA_TEMPORAL)
class LandingApiTests(APITestCase):
    def setUp(self):
        self.admin = crear_usuario("rector", Rol.ADMINISTRADOR)

    def titulos(self, seccion, **parametros):
        respuesta = self.client.get(URL, {"seccion": seccion, **parametros})
        self.assertEqual(respuesta.status_code, 200)
        return [e["titulo"] for e in respuesta.data]

    # --- Lectura pública

    def test_la_pagina_trae_su_contenido_inicial(self):
        self.assertEqual(self.titulos("valor"), ["Autonomía", "Liderazgo", "Pertenencia", "Cuidado ambiental"])
        self.assertEqual(len(self.titulos("oferta")), 6)
        self.assertEqual(len(self.titulos("galeria")), 5)

        informacion = self.client.get("/api/institucional/").data
        self.assertEqual(informacion["portada_destacado"], "aprende y crece.")
        self.assertTrue(informacion["horizonte_pendiente_validacion"])
        self.assertTrue(informacion["mision"])

    def test_los_elementos_ocultos_solo_los_ve_el_administrador(self):
        valor = ElementoLandingModel.objects.get(seccion="valor", titulo="Liderazgo")
        valor.activo = False
        valor.save()

        self.assertNotIn("Liderazgo", self.titulos("valor"))
        self.assertNotIn("Liderazgo", self.titulos("valor", todos="true"))
        self.client.force_authenticate(self.admin)
        self.assertIn("Liderazgo", self.titulos("valor", todos="true"))

    def test_una_seccion_invalida_se_rechaza(self):
        self.assertEqual(self.client.get(URL, {"seccion": "inventada"}).status_code, 400)

    # --- Edición

    def test_solo_el_administrador_edita_el_contenido(self):
        nuevo = {"seccion": "valor", "titulo": "Respeto", "texto": "Convivir con dignidad.", "icono": "🙏"}
        self.assertEqual(self.client.post(URL, nuevo, format="json").status_code, 401)
        self.client.force_authenticate(crear_usuario("mama"))
        self.assertEqual(self.client.post(URL, nuevo, format="json").status_code, 403)

        self.client.force_authenticate(self.admin)
        creado = self.client.post(URL, nuevo, format="json")
        self.assertEqual(creado.status_code, 201)
        self.assertIn("Respeto", self.titulos("valor"))

        cambio = self.client.patch(
            f"{URL}{creado.data['id']}/", {"texto": "Convivir con respeto.", "orden": 9}, format="json"
        )
        self.assertEqual((cambio.status_code, cambio.data["texto"]), (200, "Convivir con respeto."))

        self.assertEqual(self.client.delete(f"{URL}{creado.data['id']}/").status_code, 204)
        self.assertNotIn("Respeto", self.titulos("valor"))
        self.assertEqual(self.client.delete(f"{URL}{creado.data['id']}/").status_code, 404)

    def test_la_seccion_de_un_elemento_no_se_cambia(self):
        self.client.force_authenticate(self.admin)
        valor = ElementoLandingModel.objects.get(seccion="valor", titulo="Liderazgo")
        respuesta = self.client.patch(
            f"{URL}{valor.id}/", {"seccion": "imagen_portada", "titulo": "Otro"}, format="json"
        )
        self.assertEqual(respuesta.data["seccion"], "valor")
        self.assertEqual(respuesta.data["titulo"], "Otro")

    def test_el_administrador_edita_los_textos_de_la_portada(self):
        self.client.force_authenticate(self.admin)
        respuesta = self.client.patch(
            "/api/institucional/",
            {"portada_titulo": "Aprendemos juntos", "horizonte_pendiente_validacion": False},
            format="json",
        )
        self.assertEqual(respuesta.data["portada_titulo"], "Aprendemos juntos")
        self.assertFalse(respuesta.data["horizonte_pendiente_validacion"])
        # Lo demás no se pierde
        self.assertEqual(respuesta.data["portada_destacado"], "aprende y crece.")

    # --- Imágenes

    def test_subir_la_imagen_de_un_elemento_y_servirla_publicamente(self):
        self.client.force_authenticate(self.admin)
        foto = ElementoLandingModel.objects.filter(seccion="galeria").first()
        self.assertTrue(self.client.get(URL, {"seccion": "galeria"}).data[0]["imagen"].startswith("/img/"))

        subida = self.client.post(f"{URL}{foto.id}/imagen/", imagen(), format="multipart")
        self.assertEqual(subida.status_code, 200)
        self.assertTrue(subida.data["tiene_imagen_subida"])
        self.assertIn(f"/api/institucional/elementos/{foto.id}/imagen/?v=", subida.data["imagen"])

        self.client.force_authenticate(None)
        servida = self.client.get(f"{URL}{foto.id}/imagen/")
        self.assertEqual(servida.status_code, 200)
        self.assertEqual(servida["Content-Type"], "image/png")
        self.assertIn("immutable", servida["Cache-Control"])

    def test_solo_se_aceptan_imagenes_reales(self):
        self.client.force_authenticate(self.admin)
        foto = ElementoLandingModel.objects.filter(seccion="galeria").first()
        pdf = self.client.post(f"{URL}{foto.id}/imagen/", imagen("doc.pdf", b"%PDF-1.4"), format="multipart")
        falsa = self.client.post(
            f"{URL}{foto.id}/imagen/", imagen("falsa.png", b"no soy una imagen"), format="multipart"
        )
        self.assertEqual((pdf.status_code, falsa.status_code), (400, 400))

        self.client.force_authenticate(crear_usuario("mama"))
        self.assertEqual(self.client.post(f"{URL}{foto.id}/imagen/", imagen(), format="multipart").status_code, 403)

    def test_la_imagen_de_un_elemento_oculto_no_es_publica(self):
        self.client.force_authenticate(self.admin)
        foto = ElementoLandingModel.objects.filter(seccion="galeria").first()
        self.client.post(f"{URL}{foto.id}/imagen/", imagen(), format="multipart")
        self.client.patch(f"{URL}{foto.id}/", {"activo": False}, format="json")

        self.assertEqual(self.client.get(f"{URL}{foto.id}/imagen/").status_code, 200)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(f"{URL}{foto.id}/imagen/").status_code, 404)

    def test_quitar_la_imagen_vuelve_a_la_incluida_con_el_sitio(self):
        self.client.force_authenticate(self.admin)
        foto = ElementoLandingModel.objects.filter(seccion="galeria").first()
        estatica = foto.imagen_estatica
        self.client.post(f"{URL}{foto.id}/imagen/", imagen(), format="multipart")

        quitada = self.client.delete(f"{URL}{foto.id}/imagen/")
        self.assertEqual((quitada.status_code, quitada.data["imagen"]), (200, estatica))
        self.assertEqual(self.client.get(f"{URL}{foto.id}/imagen/").status_code, 404)

    def test_las_imagenes_unicas_se_reemplazan_sin_duplicarse(self):
        self.client.force_authenticate(self.admin)
        primera = self.client.put("/api/institucional/imagenes/imagen_portada/", imagen(), format="multipart")
        segunda = self.client.put("/api/institucional/imagenes/imagen_portada/", imagen("otra.png"), format="multipart")
        self.assertEqual((primera.status_code, segunda.status_code), (200, 200))
        self.assertEqual(primera.data["id"], segunda.data["id"])
        self.assertEqual(ElementoLandingModel.objects.filter(seccion="imagen_portada").count(), 1)

        lista = self.client.put("/api/institucional/imagenes/valor/", imagen(), format="multipart")
        self.assertEqual(lista.status_code, 400)
        inexistente = self.client.put("/api/institucional/imagenes/nada/", imagen(), format="multipart")
        self.assertEqual(inexistente.status_code, 400)

    def test_eliminar_un_elemento_borra_su_imagen_del_almacenamiento(self):
        self.client.force_authenticate(self.admin)
        foto = ElementoLandingModel.objects.filter(seccion="galeria").first()
        self.client.post(f"{URL}{foto.id}/imagen/", imagen(), format="multipart")
        ruta = ElementoLandingModel.objects.get(id=foto.id).imagen.name

        from django.core.files.storage import default_storage

        self.assertTrue(default_storage.exists(ruta))
        self.client.delete(f"{URL}{foto.id}/")
        self.assertFalse(default_storage.exists(ruta))
