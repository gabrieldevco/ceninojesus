"""Límite de envíos por IP (o por usuario si inició sesión) para frenar spam y fuerza bruta."""

from rest_framework.throttling import ScopedRateThrottle


class LimiteEnvios(ScopedRateThrottle):
    """
    Como ScopedRateThrottle, pero solo cuenta los POST: el listado (GET) que hace
    el administrador sobre la misma ruta no se limita.
    Uso en la vista: throttle_classes = [LimiteEnvios]; throttle_scope = "formularios"
    """

    def allow_request(self, request, view):
        if request.method != "POST":
            return True
        return super().allow_request(request, view)
