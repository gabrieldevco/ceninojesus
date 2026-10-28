"""Bloqueo temporal por intentos fallidos de inicio de sesión (fuerza bruta por cuenta)."""

from django.conf import settings
from django.core.cache import cache


class BloqueoPorIntentos:
    """
    Cuenta los fallos por (cuenta, IP) en la caché compartida (Redis en producción).
    Al llegar al máximo, bloquea ese par durante `SEGUNDOS_BLOQUEO`. Un acierto reinicia el contador.
    La clave incluye la IP: un atacante no puede bloquear a la persona real desde otra red.
    """

    def __init__(self, identificador: str, ip: str):
        self.clave = f"login-fallos:{identificador.strip().lower()}:{ip}"

    @property
    def bloqueado(self) -> bool:
        return cache.get(self.clave, 0) >= settings.LOGIN_MAX_INTENTOS

    def registrar_fallo(self) -> None:
        cache.add(self.clave, 0, timeout=settings.LOGIN_SEGUNDOS_BLOQUEO)
        try:
            cache.incr(self.clave)
        except ValueError:
            cache.set(self.clave, 1, timeout=settings.LOGIN_SEGUNDOS_BLOQUEO)

    def reiniciar(self) -> None:
        cache.delete(self.clave)
