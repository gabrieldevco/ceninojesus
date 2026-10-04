from django.urls import path

from .views import MarcarLeidaView, MisNotificacionesView

urlpatterns = [
    path("", MisNotificacionesView.as_view(), name="notificaciones"),
    path("<int:notificacion_id>/leer/", MarcarLeidaView.as_view(), name="notificacion-leer"),
]
