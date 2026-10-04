"""Permisos de DRF basados en el rol del usuario (RNF-03)."""

from rest_framework.permissions import BasePermission

from shared.domain.actor import Actor, Rol


def actor_desde_request(request) -> Actor:
    usuario = request.user
    rol = Rol.ADMINISTRADOR if usuario.is_superuser else Rol(usuario.rol)
    return Actor(id=usuario.id, rol=rol)


class _TieneRol(BasePermission):
    roles: tuple[Rol, ...] = ()

    def has_permission(self, request, view):
        usuario = request.user
        if not (usuario and usuario.is_authenticated):
            return False
        return actor_desde_request(request).rol in self.roles


def roles_permitidos(*roles: Rol):
    """Uso: permission_classes = [roles_permitidos(Rol.ADMINISTRADOR, Rol.ACUDIENTE)]"""
    return type("RolPermitido", (_TieneRol,), {"roles": roles})


EsAdministrador = roles_permitidos(Rol.ADMINISTRADOR)
EsGestorDeGrupos = roles_permitidos(Rol.ADMINISTRADOR, Rol.ADMINISTRADOR_GRUPO)
EsAcudiente = roles_permitidos(Rol.ACUDIENTE)
