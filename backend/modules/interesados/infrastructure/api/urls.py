from django.urls import path

from .views import AnonimizarInteresadoView, CambiarEstadoInteresadoView, InteresadoListCreateView, SeguimientosView

urlpatterns = [
    path("", InteresadoListCreateView.as_view(), name="interesados"),
    path("<int:interesado_id>/estado/", CambiarEstadoInteresadoView.as_view(), name="interesado-estado"),
    path("<int:interesado_id>/seguimientos/", SeguimientosView.as_view(), name="interesado-seguimientos"),
    path("<int:interesado_id>/anonimizar/", AnonimizarInteresadoView.as_view(), name="interesado-anonimizar"),
]
