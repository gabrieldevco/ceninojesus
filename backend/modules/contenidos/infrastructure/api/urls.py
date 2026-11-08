"""Rutas anidadas bajo /api/grupos/<grupo_id>/."""

from django.urls import path

from .views import (
    ArchivoEntregaView,
    CalificarEntregaView,
    ContenidoArchivoView,
    ContenidoDetailView,
    ContenidoListCreateView,
    EntregasDeActividadView,
    MiEntregaView,
    MisEntregasView,
)

# Entregas: el estudiante entrega su trabajo y el docente lo califica
urlpatterns = [
    path("actividades/mis-entregas/", MisEntregasView.as_view(), name="mis-entregas"),
    path("actividades/<int:contenido_id>/entrega/", MiEntregaView.as_view(), name="mi-entrega"),
    path("actividades/<int:contenido_id>/entregas/", EntregasDeActividadView.as_view(), name="entregas"),
    path(
        "actividades/<int:contenido_id>/entregas/<int:entrega_id>/calificar/",
        CalificarEntregaView.as_view(),
        name="entrega-calificar",
    ),
    path(
        "actividades/<int:contenido_id>/entregas/<int:entrega_id>/archivo/",
        ArchivoEntregaView.as_view(),
        name="entrega-archivo",
    ),
]

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
