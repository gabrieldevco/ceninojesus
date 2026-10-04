"""Reglas de negocio de grupos y matrículas, sin base de datos."""

from unittest import TestCase

from modules.grupos.domain.entities import EstadoSolicitud, GrupoExtracurricular, SolicitudMatricula
from modules.grupos.domain.exceptions import MotivoRechazoRequerido, SolicitudYaResuelta
from shared.domain.actor import Actor, Rol

ADMIN_GRUPO = Actor(id=10, rol=Rol.ADMINISTRADOR_GRUPO)


def solicitud():
    return SolicitudMatricula(grupo_id=1, estudiante_id=2, acudiente_id=3)


class GrupoTests(TestCase):
    def test_gestionado_por_sus_administradores_y_el_general(self):
        grupo = GrupoExtracurricular(nombre="Ajedrez", administrador_ids=[10])
        self.assertTrue(grupo.es_gestionado_por(ADMIN_GRUPO))
        self.assertTrue(grupo.es_gestionado_por(Actor(id=1, rol=Rol.ADMINISTRADOR)))
        self.assertFalse(grupo.es_gestionado_por(Actor(id=11, rol=Rol.ADMINISTRADOR_GRUPO)))

    def test_cupo(self):
        self.assertTrue(GrupoExtracurricular(nombre="A").tiene_cupo(1000))
        self.assertTrue(GrupoExtracurricular(nombre="A", cupo_maximo=2).tiene_cupo(1))
        self.assertFalse(GrupoExtracurricular(nombre="A", cupo_maximo=2).tiene_cupo(2))


class SolicitudTests(TestCase):
    def test_aprobar(self):
        s = solicitud()
        s.aprobar(ADMIN_GRUPO)
        self.assertEqual(s.estado, EstadoSolicitud.APROBADA)
        self.assertEqual(s.respondida_por_id, ADMIN_GRUPO.id)
        self.assertIsNotNone(s.fecha_respuesta)

    def test_rechazar_exige_motivo(self):
        with self.assertRaises(MotivoRechazoRequerido):
            solicitud().rechazar(ADMIN_GRUPO, "  ")

    def test_no_se_resuelve_dos_veces(self):
        s = solicitud()
        s.rechazar(ADMIN_GRUPO, "Sin cupo en el horario")
        with self.assertRaises(SolicitudYaResuelta):
            s.aprobar(ADMIN_GRUPO)
