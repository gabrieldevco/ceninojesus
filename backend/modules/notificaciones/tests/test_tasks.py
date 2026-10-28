from unittest import mock

from django.core import mail
from django.test import SimpleTestCase, TestCase

from config.celery import app
from modules.notificaciones.infrastructure.correo import DjangoEnviadorCorreo
from modules.notificaciones.infrastructure.tasks import enviar_correo


class EnvioDeCorreoTests(TestCase):
    def test_el_adaptador_encola_y_el_correo_sale(self):
        DjangoEnviadorCorreo().enviar(["a@example.com", ""], "Asunto", "Cuerpo")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["a@example.com"])

    def test_sin_destinatarios_no_encola(self):
        with mock.patch.object(enviar_correo, "delay") as delay:
            DjangoEnviadorCorreo().enviar(["", ""], "Asunto", "Cuerpo")
        delay.assert_not_called()

    def test_si_la_cola_falla_la_operacion_no_falla(self):
        with mock.patch.object(enviar_correo, "delay", side_effect=ConnectionError):
            DjangoEnviadorCorreo().enviar(["a@example.com"], "Asunto", "Cuerpo")

    def test_un_error_de_red_se_reintenta(self):
        with mock.patch("modules.notificaciones.infrastructure.tasks.send_mail", side_effect=OSError("smtp")):
            resultado = enviar_correo.apply(args=(["a@example.com"], "Asunto", "Cuerpo"))
        self.assertIsInstance(resultado.result, Exception)

    def test_otro_error_se_registra_sin_reintentar(self):
        with mock.patch("modules.notificaciones.infrastructure.tasks.send_mail", side_effect=ValueError("x")):
            resultado = enviar_correo.apply(args=(["a@example.com"], "Asunto", "Cuerpo"))
        self.assertTrue(resultado.successful())


class ProgramacionTests(SimpleTestCase):
    def test_las_tareas_periodicas_estan_registradas(self):
        app.loader.import_default_modules()
        for tarea in ("interesados.enviar_recordatorios", "datos_personales.alertar_por_vencer"):
            self.assertIn(tarea, app.tasks)
        programadas = {c["task"] for c in app.conf.beat_schedule.values()}
        self.assertEqual(programadas, {"interesados.enviar_recordatorios", "datos_personales.alertar_por_vencer"})
