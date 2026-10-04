"""Pruebas del dominio y los casos de uso: sin base de datos ni Django."""

from datetime import datetime, timedelta, timezone
from unittest import TestCase

from modules.interesados.application.use_cases import (
    CambiarEstadoInteresado,
    EnviarRecordatoriosSeguimiento,
    RegistrarInteresado,
    RegistrarInteresadoCommand,
)
from modules.interesados.domain.entities import EstadoInteresado, Interesado
from modules.interesados.domain.exceptions import (
    AutorizacionDatosRequerida,
    InteresadoNoEncontrado,
    TransicionEstadoInvalida,
)
from modules.interesados.domain.ports import InteresadoRepository, RecordatorioRepository
from shared.testing import FakeNotificador


class InMemoryInteresadoRepository(InteresadoRepository):
    def __init__(self):
        self.items = {}

    def guardar(self, interesado):
        if interesado.id is None:
            interesado.id = len(self.items) + 1
        self.items[interesado.id] = interesado
        return interesado

    def obtener_por_id(self, interesado_id):
        return self.items.get(interesado_id)

    def listar(self, estado=None):
        return [i for i in self.items.values() if estado is None or i.estado == estado]

    def listar_pendientes(self):
        return [i for i in self.items.values() if i.esta_pendiente]


class InMemoryRecordatorioRepository(RecordatorioRepository):
    def __init__(self):
        self.enviados = {}

    def registrar(self, interesado_ids, fecha):
        for interesado_id in interesado_ids:
            self.enviados[interesado_id] = fecha

    def ultimos(self, interesado_ids):
        return {i: f for i, f in self.enviados.items() if i in interesado_ids}


def crear_interesado(**kwargs):
    datos = {
        "nombre_completo": "Ana Pérez",
        "correo": "ana@example.com",
        "telefono": "3000000000",
        "autoriza_tratamiento_datos": True,
    }
    return Interesado(**{**datos, **kwargs})


AHORA = datetime(2026, 10, 10, tzinfo=timezone.utc)


class InteresadoTests(TestCase):
    def test_nuevo_interesado_inicia_en_estado_nuevo(self):
        self.assertEqual(crear_interesado().estado, EstadoInteresado.NUEVO)

    def test_requiere_autorizacion_de_datos(self):
        with self.assertRaises(AutorizacionDatosRequerida):
            crear_interesado(autoriza_tratamiento_datos=False)

    def test_cambiar_estado_registra_fecha_de_contacto(self):
        interesado = crear_interesado()
        interesado.cambiar_estado(EstadoInteresado.EN_SEGUIMIENTO)
        self.assertEqual(interesado.estado, EstadoInteresado.EN_SEGUIMIENTO)
        self.assertIsNotNone(interesado.fecha_ultimo_contacto)

    def test_no_se_puede_salir_de_un_estado_final(self):
        interesado = crear_interesado(estado=EstadoInteresado.MATRICULADO)
        with self.assertRaises(TransicionEstadoInvalida):
            interesado.cambiar_estado(EstadoInteresado.EN_SEGUIMIENTO)

    def test_registrar_contacto_pasa_a_seguimiento(self):
        interesado = crear_interesado()
        interesado.registrar_contacto()
        self.assertEqual(interesado.estado, EstadoInteresado.EN_SEGUIMIENTO)

    def test_requiere_recordatorio_tras_el_plazo_sin_respuesta(self):
        interesado = crear_interesado(fecha_registro=AHORA - timedelta(days=4))
        self.assertTrue(interesado.requiere_recordatorio(AHORA, dias=3, ultimo_recordatorio=None))

    def test_no_requiere_recordatorio_dentro_del_plazo(self):
        interesado = crear_interesado(fecha_registro=AHORA - timedelta(days=1))
        self.assertFalse(interesado.requiere_recordatorio(AHORA, dias=3, ultimo_recordatorio=None))

    def test_no_repite_recordatorio_reciente(self):
        interesado = crear_interesado(fecha_registro=AHORA - timedelta(days=10))
        ultimo = AHORA - timedelta(days=1)
        self.assertFalse(interesado.requiere_recordatorio(AHORA, dias=3, ultimo_recordatorio=ultimo))

    def test_estado_final_no_requiere_recordatorio(self):
        interesado = crear_interesado(
            fecha_registro=AHORA - timedelta(days=10), estado=EstadoInteresado.DESCARTADO
        )
        self.assertFalse(interesado.requiere_recordatorio(AHORA, dias=3, ultimo_recordatorio=None))


class CasosDeUsoTests(TestCase):
    def setUp(self):
        self.repository = InMemoryInteresadoRepository()
        self.notificador = FakeNotificador()

    def test_registrar_interesado_avisa_a_administradores(self):
        interesado = RegistrarInteresado(self.repository, self.notificador).execute(
            RegistrarInteresadoCommand(
                nombre_completo="Ana Pérez",
                correo="ana@example.com",
                telefono="3000000000",
                autoriza_tratamiento_datos=True,
            )
        )
        self.assertIsNotNone(interesado.id)
        self.assertEqual(self.repository.listar(), [interesado])
        self.assertEqual(len(self.notificador.enviadas), 1)

    def test_cambiar_estado_de_interesado_inexistente(self):
        with self.assertRaises(InteresadoNoEncontrado):
            CambiarEstadoInteresado(self.repository).execute(99, EstadoInteresado.DESCARTADO)

    def test_recordatorios_solo_para_vencidos_y_sin_repetir(self):
        vencido = self.repository.guardar(crear_interesado(fecha_registro=AHORA - timedelta(days=5)))
        self.repository.guardar(crear_interesado(fecha_registro=AHORA - timedelta(hours=5)))
        recordatorios = InMemoryRecordatorioRepository()
        caso = EnviarRecordatoriosSeguimiento(self.repository, recordatorios, self.notificador)

        self.assertEqual(caso.execute(dias=3, ahora=AHORA), [vencido])
        self.assertEqual(len(self.notificador.enviadas), 1)
        # Al día siguiente no se repite el aviso del mismo interesado
        self.assertEqual(caso.execute(dias=3, ahora=AHORA + timedelta(days=1)), [])
