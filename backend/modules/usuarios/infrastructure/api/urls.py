from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

auth_urlpatterns = [
    path("token/", views.IniciarSesionView.as_view(), name="token"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views.CerrarSesionView.as_view(), name="logout"),
    path("registro/", views.RegistroAcudienteView.as_view(), name="registro"),
    path("recuperar/", views.SolicitarRecuperacionView.as_view(), name="recuperar"),
    path("recuperar/confirmar/", views.ConfirmarRecuperacionView.as_view(), name="recuperar-confirmar"),
    path("perfil/", views.PerfilView.as_view(), name="perfil"),
    path("perfil/contrasena/", views.CambiarContrasenaView.as_view(), name="perfil-contrasena"),
    path("mis-datos/", views.MisDatosView.as_view(), name="mis-datos"),
]

usuarios_urlpatterns = [
    path("", views.UsuarioListCreateView.as_view(), name="usuarios"),
    path("<int:usuario_id>/", views.UsuarioDetailView.as_view(), name="usuario"),
    path("<int:usuario_id>/anonimizar/", views.AnonimizarUsuarioView.as_view(), name="usuario-anonimizar"),
]

estudiantes_urlpatterns = [
    path("", views.EstudianteListCreateView.as_view(), name="estudiantes"),
    path("<int:estudiante_id>/", views.EstudianteDetailView.as_view(), name="estudiante"),
    path("<int:estudiante_id>/acceso/", views.AccesoEstudianteView.as_view(), name="estudiante-acceso"),
    path(
        "<int:estudiante_id>/acceso/contrasena/",
        views.ContrasenaEstudianteView.as_view(),
        name="estudiante-contrasena",
    ),
]
