"""Registro, autenticación JWT, contraseñas, roles (RF-06, RF-20), estudiantes y derechos (Ley 1581)."""

import re
from unittest import mock

from django.core import mail
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from modules.usuarios.infrastructure.models import EstudianteModel
from shared.domain.actor import Rol
from shared.testing_api import crear_usuario

REGISTRO = {
    "nombre_usuario": "maria",
    "password": "clave-segura-123",
    "correo": "maria@example.com",
    "nombres": "María",
    "apellidos": "López",
    "autoriza_tratamiento_datos": True,
}

HIJO = {"nombres": "Luis", "apellidos": "Pérez", "grado": "5°", "autoriza_tratamiento_datos": True}


class AutenticacionTests(APITestCase):
    def test_registro_y_login_jwt(self):
        registro = self.client.post("/api/auth/registro/", REGISTRO, format="json")
        self.assertEqual(registro.status_code, 201)
        self.assertEqual(registro.data["rol"], "acudiente")
        self.assertIsNotNone(registro.data["fecha_autorizacion_datos"])
        self.assertNotIn("password", registro.data)

        token = self.client.post(
            "/api/auth/token/", {"nombre_usuario": "maria", "password": "clave-segura-123"}, format="json"
        )
        self.assertEqual(token.status_code, 200)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.data['access']}")
        perfil = self.client.get("/api/auth/perfil/")
        self.assertEqual(perfil.data["nombre_usuario"], "maria")

    def test_registro_exige_autorizacion_de_datos(self):
        response = self.client.post("/api/auth/registro/", {**REGISTRO, "autoriza_tratamiento_datos": False})
        self.assertEqual(response.status_code, 400)

    def test_registro_rechaza_clave_debil_y_nombre_repetido(self):
        self.assertEqual(self.client.post("/api/auth/registro/", {**REGISTRO, "password": "123"}).status_code, 400)
        self.client.post("/api/auth/registro/", REGISTRO, format="json")
        self.assertEqual(self.client.post("/api/auth/registro/", REGISTRO, format="json").status_code, 400)

    def test_perfil_no_permite_cambiar_rol(self):
        acudiente = crear_usuario("mama")
        self.client.force_authenticate(acudiente)
        self.client.patch("/api/auth/perfil/", {"rol": "administrador", "telefono": "300"}, format="json")
        acudiente.refresh_from_db()
        self.assertEqual(acudiente.rol, Rol.ACUDIENTE)
        self.assertEqual(acudiente.telefono, "300")

    def test_area_restringida_requiere_autenticacion(self):
        self.assertEqual(self.client.get("/api/auth/perfil/").status_code, 401)

    def test_limite_de_intentos_de_inicio_de_sesion(self):
        with mock.patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"autenticacion": "3/minute"}):
            credenciales = {"nombre_usuario": "nadie", "password": "x"}
            codigos = [self.client.post("/api/auth/token/", credenciales).status_code for _ in range(4)]
        self.assertEqual(codigos, [401, 401, 401, 429])


class ContrasenasTests(APITestCase):
    def setUp(self):
        self.usuario = crear_usuario("mama", nombres="Ana")

    def test_recuperacion_completa_por_correo(self):
        response = self.client.post("/api/auth/recuperar/", {"identificador": "mama@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)

        uid, token = re.search(r"uid=([^&\s]+)&token=(\S+)", mail.outbox[0].body).groups()
        confirmacion = self.client.post(
            "/api/auth/recuperar/confirmar/", {"uid": uid, "token": token, "password": "nueva-clave-456"}
        )
        self.assertEqual(confirmacion.status_code, 200)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_password("nueva-clave-456"))

        # El enlace es de un solo uso
        reuso = self.client.post(
            "/api/auth/recuperar/confirmar/", {"uid": uid, "token": token, "password": "otra-clave-789"}
        )
        self.assertEqual(reuso.status_code, 400)

    def test_recuperacion_no_revela_si_la_cuenta_existe(self):
        existe = self.client.post("/api/auth/recuperar/", {"identificador": "mama"})
        no_existe = self.client.post("/api/auth/recuperar/", {"identificador": "nadie@example.com"})
        self.assertEqual(existe.data, no_existe.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_cambiar_contrasena_exige_la_actual(self):
        self.client.force_authenticate(self.usuario)
        url = "/api/auth/perfil/contrasena/"
        mala = self.client.post(url, {"password_actual": "errada", "password_nueva": "nueva-clave-456"})
        self.assertEqual(mala.status_code, 400)
        buena = self.client.post(url, {"password_actual": "clave-segura-123", "password_nueva": "nueva-clave-456"})
        self.assertEqual(buena.status_code, 200)

    def test_acudiente_restablece_contrasena_de_su_hijo(self):
        estudiante = crear_usuario("luis", Rol.ESTUDIANTE)
        hijo = EstudianteModel.objects.create(
            nombres="Luis", apellidos="Pérez", acudiente=self.usuario, usuario=estudiante
        )
        self.client.force_authenticate(self.usuario)
        response = self.client.post(f"/api/estudiantes/{hijo.id}/acceso/contrasena/", {"password": "nueva-clave-456"})
        self.assertEqual(response.status_code, 200)
        estudiante.refresh_from_db()
        self.assertTrue(estudiante.check_password("nueva-clave-456"))


class GestionUsuariosTests(APITestCase):
    def setUp(self):
        self.admin = crear_usuario("rector", Rol.ADMINISTRADOR)

    def test_administrador_crea_y_cambia_rol(self):
        self.client.force_authenticate(self.admin)
        creado = self.client.post(
            "/api/usuarios/",
            {"nombre_usuario": "profe", "password": "clave-segura-123", "rol": "administrador_grupo"},
            format="json",
        )
        self.assertEqual(creado.status_code, 201)
        actualizado = self.client.patch(f"/api/usuarios/{creado.data['id']}/", {"activo": False}, format="json")
        self.assertFalse(actualizado.data["activo"])
        self.assertEqual(len(self.client.get("/api/usuarios/?rol=administrador_grupo").data), 1)

    def test_solo_el_administrador_gestiona_usuarios(self):
        self.client.force_authenticate(crear_usuario("mama"))
        self.assertEqual(self.client.get("/api/usuarios/").status_code, 403)

    def test_el_administrador_no_puede_quitarse_el_acceso(self):
        self.client.force_authenticate(self.admin)
        url = f"/api/usuarios/{self.admin.id}/"
        self.assertEqual(self.client.patch(url, {"activo": False}, format="json").status_code, 403)
        self.assertEqual(self.client.patch(url, {"rol": "acudiente"}, format="json").status_code, 403)
        self.assertEqual(self.client.post(f"{url}anonimizar/").status_code, 403)
        # Sí puede corregir sus datos o confirmar su propio rol
        self.assertEqual(
            self.client.patch(url, {"rol": "administrador", "nombres": "Rector"}, format="json").status_code, 200
        )
        self.admin.refresh_from_db()
        self.assertTrue(self.admin.is_active)

    def test_cambiar_rol_y_desactivar_a_otro_usuario(self):
        profe = crear_usuario("profe", Rol.ACUDIENTE)
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            f"/api/usuarios/{profe.id}/", {"rol": "administrador_grupo", "activo": False}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual((response.data["rol"], response.data["activo"]), ("administrador_grupo", False))

    def test_anonimizar_acudiente_y_sus_hijos(self):
        acudiente = crear_usuario("mama", nombres="Ana", telefono="300")
        cuenta_hijo = crear_usuario("luis", Rol.ESTUDIANTE)
        hijo = EstudianteModel.objects.create(
            nombres="Luis", apellidos="Pérez", documento_identidad="123", acudiente=acudiente, usuario=cuenta_hijo
        )
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/api/usuarios/{acudiente.id}/anonimizar/")
        self.assertEqual(response.status_code, 200)

        acudiente.refresh_from_db()
        hijo.refresh_from_db()
        cuenta_hijo.refresh_from_db()
        self.assertEqual(acudiente.nombre_usuario, f"anonimo-{acudiente.id}")
        self.assertEqual((acudiente.correo, acudiente.nombres, acudiente.telefono), ("", "", ""))
        self.assertFalse(acudiente.is_active)
        self.assertFalse(acudiente.has_usable_password())
        self.assertEqual(hijo.documento_identidad, "")
        self.assertFalse(cuenta_hijo.is_active)


class EstudiantesTests(APITestCase):
    def setUp(self):
        self.acudiente = crear_usuario("mama")
        self.client.force_authenticate(self.acudiente)

    def test_acudiente_registra_hijo_y_le_crea_acceso(self):
        hijo = self.client.post("/api/estudiantes/", HIJO)
        self.assertEqual(hijo.status_code, 201)
        self.assertEqual(hijo.data["acudiente_id"], self.acudiente.id)
        self.assertIsNotNone(hijo.data["fecha_autorizacion_datos"])

        url = f"/api/estudiantes/{hijo.data['id']}/acceso/"
        acceso = self.client.post(url, {"nombre_usuario": "luis", "password": "clave-segura-123"})
        self.assertEqual(acceso.status_code, 201)
        self.assertIsNotNone(acceso.data["usuario_id"])
        # Solo se crea un acceso por estudiante
        segundo = self.client.post(url, {"nombre_usuario": "luis2", "password": "clave-segura-123"})
        self.assertEqual(segundo.status_code, 400)

    def test_registrar_menor_exige_autorizacion_del_acudiente(self):
        response = self.client.post("/api/estudiantes/", {**HIJO, "autoriza_tratamiento_datos": False})
        self.assertEqual(response.status_code, 400)

    def test_acudiente_solo_ve_y_gestiona_sus_hijos(self):
        otro = crear_usuario("papa")
        self.client.force_authenticate(otro)
        ajeno = self.client.post("/api/estudiantes/", {**HIJO, "nombres": "Ana"}).data

        self.client.force_authenticate(self.acudiente)
        self.assertEqual(self.client.get("/api/estudiantes/").data, [])
        response = self.client.patch(f"/api/estudiantes/{ajeno['id']}/", {"grado": "6°"})
        self.assertEqual(response.status_code, 403)

    def test_mis_datos_incluye_hijos_y_matriculas(self):
        self.client.post("/api/estudiantes/", HIJO)
        datos = self.client.get("/api/auth/mis-datos/").data
        self.assertEqual(datos["perfil"]["nombre_usuario"], "mama")
        self.assertEqual(len(datos["estudiantes"]), 1)
        self.assertEqual(datos["solicitudes_matricula"], [])
