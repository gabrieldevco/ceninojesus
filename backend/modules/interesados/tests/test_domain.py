"""Pruebas del dominio y los casos de uso: sin base de datos ni Django."""

from unittest import TestCase

from modules.interesados.application.use_cases import (
    CambiarEstadoInteresado,
    RegistrarInteresado,
    RegistrarInteresadoCommand,
)
from modules.interesados.domain.entities import EstadoInteresado, Interesado
from modules.interesados.domain.exceptions import (
    AutorizacionDatosRequerida,
    InteresadoNoEncontrado,
    TransicionEstadoInvalida,
)
from modules.interesados.domain.ports import InteresadoRepository


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


def crear_interesado(**kwargs):
    datos = {
        "nombre_completo": "Ana Pérez",
        "correo": "ana@example.com",
        "telefono": "3000000000",
        "autoriza_tratamiento_datos": True,
    }
    return Interesado(**{**datos, **kwargs})


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


class CasosDeUsoTests(TestCase):
    def setUp(self):
        self.repository = InMemoryInteresadoRepository()

    def test_registrar_interesado(self):
        interesado = RegistrarInteresado(self.repository).execute(
            RegistrarInteresadoCommand(
                nombre_completo="Ana Pérez",
                correo="ana@example.com",
                telefono="3000000000",
                autoriza_tratamiento_datos=True,
            )
        )
        self.assertIsNotNone(interesado.id)
        self.assertEqual(self.repository.listar(), [interesado])

    def test_cambiar_estado_de_interesado_inexistente(self):
        with self.assertRaises(InteresadoNoEncontrado):
            CambiarEstadoInteresado(self.repository).execute(99, EstadoInteresado.DESCARTADO)
