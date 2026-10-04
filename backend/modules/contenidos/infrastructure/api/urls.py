"""Rutas anidadas bajo /api/grupos/<grupo_id>/."""

from django.urls import path

from .views import ContenidoArchivoView, ContenidoDetailView, ContenidoListCreateView

urlpatterns = []

for tipo in ("materiales", "actividades"):
    urlpatterns += [
        path(f"{tipo}/", ContenidoListCreateView.as_view(tipo=tipo), name=tipo),
        path(f"{tipo}/<int:contenido_id>/", ContenidoDetailView.as_view(tipo=tipo), name=f"{tipo}-detalle"),
        path(
            f"{tipo}/<int:contenido_id>/archivo/",
            ContenidoArchivoView.as_view(tipo=tipo),
            name=f"{tipo}-archivo",
        ),
    ]
