from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase


class UsuarioTests(TestCase):
    def test_crear_superusuario(self):
        usuario = get_user_model().objects.create_superuser("admin", "admin@example.com", "clave-segura-123")
        self.assertTrue(usuario.is_staff)
        self.assertTrue(usuario.check_password("clave-segura-123"))

    def test_tablas_y_columnas_en_espanol(self):
        tablas = connection.introspection.table_names()
        self.assertIn("usuarios", tablas)
        self.assertIn("usuarios_grupos", tablas)
        self.assertIn("usuarios_permisos", tablas)
        self.assertNotIn("auth_user", tablas)

        with connection.cursor() as cursor:
            columnas = {c.name for c in connection.introspection.get_table_description(cursor, "usuarios")}
        self.assertTrue({"contrasena", "ultimo_ingreso", "activo", "es_personal", "es_superusuario"} <= columnas)
