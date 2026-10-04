from django.contrib import admin
from django.urls import include, path

from modules.grupos.infrastructure.api.urls import grupos_urlpatterns, matriculas_urlpatterns
from modules.usuarios.infrastructure.api.urls import (
    auth_urlpatterns,
    estudiantes_urlpatterns,
    usuarios_urlpatterns,
)
from shared.infrastructure.salud import SaludView

admin.site.site_header = "Centro Educativo El Niño Jesús"
admin.site.site_title = "Administración"

api = [
    path("salud/", SaludView.as_view(), name="salud"),
    path("auth/", include(auth_urlpatterns)),
    path("usuarios/", include(usuarios_urlpatterns)),
    path("estudiantes/", include(estudiantes_urlpatterns)),
    path("institucional/", include("modules.institucional.infrastructure.api.urls")),
    path("grupos/", include(grupos_urlpatterns)),
    path("grupos/<int:grupo_id>/", include("modules.contenidos.infrastructure.api.urls")),
    path("matriculas/", include(matriculas_urlpatterns)),
    path("interesados/", include("modules.interesados.infrastructure.api.urls")),
    path("notificaciones/", include("modules.notificaciones.infrastructure.api.urls")),
    path("datos-personales/", include("modules.datos_personales.infrastructure.api.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api)),
]
