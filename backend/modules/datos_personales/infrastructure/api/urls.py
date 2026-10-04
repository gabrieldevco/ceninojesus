from django.urls import path

from . import views

urlpatterns = [
    path("solicitudes/", views.SolicitudDatosListCreateView.as_view(), name="solicitudes-datos"),
    path(
        "solicitudes/<int:solicitud_id>/tramitar/",
        views.TramitarSolicitudDatosView.as_view(),
        name="solicitud-datos-tramitar",
    ),
    path(
        "solicitudes/<int:solicitud_id>/responder/",
        views.ResponderSolicitudDatosView.as_view(),
        name="solicitud-datos-responder",
    ),
]
