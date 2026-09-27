from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/interesados/", include("modules.interesados.infrastructure.api.urls")),
]
