from modules.notificaciones.domain.entities import Notificacion
from modules.notificaciones.domain.ports import NotificacionRepository

from .models import NotificacionModel


class DjangoNotificacionRepository(NotificacionRepository):
    def guardar(self, notificacion: Notificacion) -> Notificacion:
        model, _ = NotificacionModel.objects.update_or_create(
            id=notificacion.id,
            defaults={
                "usuario_id": notificacion.usuario_id,
                "titulo": notificacion.titulo,
                "mensaje": notificacion.mensaje,
                "leida": notificacion.leida,
                "fecha_creacion": notificacion.fecha_creacion,
            },
        )
        return self._to_entity(model)

    def obtener_por_id(self, notificacion_id: int) -> Notificacion | None:
        model = NotificacionModel.objects.filter(id=notificacion_id).first()
        return self._to_entity(model) if model else None

    def listar_de_usuario(self, usuario_id: int, solo_no_leidas: bool = False) -> list[Notificacion]:
        queryset = NotificacionModel.objects.filter(usuario_id=usuario_id)
        if solo_no_leidas:
            queryset = queryset.filter(leida=False)
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _to_entity(model: NotificacionModel) -> Notificacion:
        return Notificacion(
            id=model.id,
            usuario_id=model.usuario_id,
            titulo=model.titulo,
            mensaje=model.mensaje,
            leida=model.leida,
            fecha_creacion=model.fecha_creacion,
        )
