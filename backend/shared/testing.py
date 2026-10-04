"""Dobles de prueba compartidos por los tests de dominio y casos de uso."""

from shared.domain.notificaciones import Notificador


class FakeNotificador(Notificador):
    """Registra las notificaciones en memoria en lugar de enviarlas."""

    def __init__(self):
        self.enviadas = []

    def notificar(self, usuario_ids, titulo, mensaje):
        self.enviadas.append({"usuario_ids": list(usuario_ids), "titulo": titulo, "mensaje": mensaje})

    def notificar_administradores(self, titulo, mensaje):
        self.enviadas.append({"usuario_ids": "administradores", "titulo": titulo, "mensaje": mensaje})
