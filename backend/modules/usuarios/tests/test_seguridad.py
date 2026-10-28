"""Endurecimiento de seguridad: rotación de refresh, cierre de sesión, bloqueo por intentos y hash de contraseñas."""

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from shared.testing_api import crear_usuario

LOGIN = "/api/auth/token/"


def credenciales(clave="clave-segura-123", usuario="maria"):
    return {"nombre_usuario": usuario, "password": clave}


class SesionTests(APITestCase):
    def setUp(self):
        crear_usuario("maria")

    def test_el_refresh_rota_y_el_anterior_deja_de_servir(self):
        refresh = self.client.post(LOGIN, credenciales(), format="json").data["refresh"]

        nuevo = self.client.post("/api/auth/token/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(nuevo.status_code, 200)
        self.assertNotEqual(nuevo.data["refresh"], refresh)

        reuso = self.client.post("/api/auth/token/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(reuso.status_code, 401)

    def test_cerrar_sesion_revoca_el_refresh(self):
        refresh = self.client.post(LOGIN, credenciales(), format="json").data["refresh"]

        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": refresh}, format="json").status_code, 204)
        self.assertEqual(
            self.client.post("/api/auth/token/refresh/", {"refresh": refresh}, format="json").status_code, 401
        )

    def test_cerrar_sesion_con_token_invalido_no_falla(self):
        self.assertEqual(self.client.post("/api/auth/logout/", {"refresh": "basura"}, format="json").status_code, 204)
        self.assertEqual(self.client.post("/api/auth/logout/", {}, format="json").status_code, 400)


class BloqueoPorIntentosTests(APITestCase):
    def setUp(self):
        cache.clear()
        crear_usuario("maria")

    def fallar(self, veces, usuario="maria"):
        return [
            self.client.post(LOGIN, credenciales("incorrecta", usuario), format="json").status_code
            for _ in range(veces)
        ]

    def test_tras_cinco_fallos_se_bloquea_incluso_con_la_clave_correcta(self):
        self.assertEqual(self.fallar(5), [401] * 5)
        self.assertEqual(self.client.post(LOGIN, credenciales(), format="json").status_code, 429)

    def test_un_acierto_reinicia_el_contador(self):
        self.fallar(4)
        self.assertEqual(self.client.post(LOGIN, credenciales(), format="json").status_code, 200)
        self.assertEqual(self.fallar(4), [401] * 4)

    def test_el_bloqueo_es_por_cuenta(self):
        crear_usuario("pedro")
        self.fallar(5)
        self.assertEqual(self.client.post(LOGIN, credenciales(usuario="pedro"), format="json").status_code, 200)

    def test_el_bloqueo_distingue_mayusculas(self):
        self.fallar(5, usuario="MARIA")
        self.assertEqual(self.client.post(LOGIN, credenciales(), format="json").status_code, 429)


class ContrasenasTests(APITestCase):
    def test_las_contrasenas_nuevas_usan_argon2(self):
        usuario = crear_usuario("maria")
        # En pruebas se usa un hasher rápido (dev.py); aquí se comprueba la configuración real
        from config.settings import base

        self.assertTrue(base.PASSWORD_HASHERS[0].endswith("Argon2PasswordHasher"))
        self.assertTrue(get_user_model().objects.get(pk=usuario.pk).has_usable_password())
