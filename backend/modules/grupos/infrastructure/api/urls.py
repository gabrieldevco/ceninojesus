from django.urls import path

from . import views

grupos_urlpatterns = [
    path("", views.GrupoListCreateView.as_view(), name="grupos"),
    path("mis-grupos/", views.MisGruposView.as_view(), name="mis-grupos"),
    path("<int:grupo_id>/", views.GrupoDetailView.as_view(), name="grupo"),
    path("<int:grupo_id>/administradores/", views.AdministradoresGrupoView.as_view(), name="grupo-administradores"),
    path("<int:grupo_id>/inscritos/", views.InscritosView.as_view(), name="grupo-inscritos"),
]

matriculas_urlpatterns = [
    path("", views.SolicitudListCreateView.as_view(), name="matriculas"),
    path("<int:solicitud_id>/aprobar/", views.AprobarSolicitudView.as_view(), name="matricula-aprobar"),
    path("<int:solicitud_id>/rechazar/", views.RechazarSolicitudView.as_view(), name="matricula-rechazar"),
]
