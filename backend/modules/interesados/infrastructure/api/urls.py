from django.urls import path

from .views import CambiarEstadoInteresadoView, InteresadoListCreateView

urlpatterns = [
    path("", InteresadoListCreateView.as_view(), name="interesados"),
    path("<int:interesado_id>/estado/", CambiarEstadoInteresadoView.as_view(), name="interesado-estado"),
]
