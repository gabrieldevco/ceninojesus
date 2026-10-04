from django.urls import path

from . import views

urlpatterns = [
    path("", views.InformacionView.as_view(), name="informacion"),
    path("politica-datos/", views.PoliticaDatosView.as_view(), name="politica-datos"),
    path("enlaces/", views.EnlaceListCreateView.as_view(), name="enlaces"),
    path("enlaces/<int:enlace_id>/", views.EnlaceDetailView.as_view(), name="enlace"),
    path("contacto/", views.MensajeContactoListCreateView.as_view(), name="contacto"),
    path("contacto/<int:mensaje_id>/leido/", views.MarcarMensajeLeidoView.as_view(), name="contacto-leido"),
]
