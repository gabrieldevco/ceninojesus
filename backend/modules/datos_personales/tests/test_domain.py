from datetime import date, datetime, timezone
from unittest import TestCase

from modules.datos_personales.domain.entities import (
    EstadoSolicitudDatos,
    SolicitudDatos,
    TipoSolicitudDatos,
    sumar_dias_habiles,
)
from modules.datos_personales.domain.exceptions import RespuestaRequerida, SolicitudYaResuelta
from shared.domain.actor import Actor, Rol

ADMIN = Actor(id=1, rol=Rol.ADMINISTRADOR)
VIERNES = datetime(2026, 10, 2, 10, tzinfo=timezone.utc)


def solicitud(tipo=TipoSolicitudDatos.CONSULTA):
    return SolicitudDatos(nombre="Ana", correo="ana@example.com", tipo=tipo, descripcion="...", fecha_solicitud=VIERNES)


class PlazosTests(TestCase):
    def test_dias_habiles_saltan_fines_de_semana(self):
        self.assertEqual(sumar_dias_habiles(date(2026, 10, 2), 1), date(2026, 10, 5))  # viernes -> lunes

    def test_consulta_10_dias_habiles(self):
        self.assertEqual(solicitud().fecha_limite, date(2026, 10, 16))

    def test_reclamo_15_dias_habiles(self):
        self.assertEqual(solicitud(TipoSolicitudDatos.SUPRESION).fecha_limite, date(2026, 10, 23))


class FlujoTests(TestCase):
    def test_responder(self):
        s = solicitud()
        s.tramitar(ADMIN)
        s.responder(ADMIN, "Estos son sus datos...")
        self.assertEqual(s.estado, EstadoSolicitudDatos.RESUELTA)
        with self.assertRaises(SolicitudYaResuelta):
            s.responder(ADMIN, "otra vez")

    def test_respuesta_vacia(self):
        with self.assertRaises(RespuestaRequerida):
            solicitud().responder(ADMIN, " ")

    def test_alerta_una_vez_al_dia_cerca_del_limite(self):
        s = solicitud()  # vence el 16/10
        self.assertFalse(s.requiere_alerta(date(2026, 10, 5), dias_anticipacion=3))
        self.assertTrue(s.requiere_alerta(date(2026, 10, 14), dias_anticipacion=3))
        s.fecha_ultima_alerta = date(2026, 10, 14)
        self.assertFalse(s.requiere_alerta(date(2026, 10, 14), dias_anticipacion=3))
