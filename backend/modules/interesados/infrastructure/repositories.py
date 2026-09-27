"""Adaptador del puerto InteresadoRepository usando el ORM de Django."""

from modules.interesados.domain.entities import EstadoInteresado, Interesado
from modules.interesados.domain.ports import InteresadoRepository

from .models import InteresadoModel


class DjangoInteresadoRepository(InteresadoRepository):
    def guardar(self, interesado: Interesado) -> Interesado:
        model, _ = InteresadoModel.objects.update_or_create(
            id=interesado.id,
            defaults={
                "nombre_completo": interesado.nombre_completo,
                "correo": interesado.correo,
                "telefono": interesado.telefono,
                "mensaje": interesado.mensaje,
                "autoriza_tratamiento_datos": interesado.autoriza_tratamiento_datos,
                "estado": interesado.estado.value,
                "fecha_registro": interesado.fecha_registro,
                "fecha_ultimo_contacto": interesado.fecha_ultimo_contacto,
            },
        )
        return self._to_entity(model)

    def obtener_por_id(self, interesado_id: int) -> Interesado | None:
        model = InteresadoModel.objects.filter(id=interesado_id).first()
        return self._to_entity(model) if model else None

    def listar(self, estado: EstadoInteresado | None = None) -> list[Interesado]:
        queryset = InteresadoModel.objects.all()
        if estado is not None:
            queryset = queryset.filter(estado=estado.value)
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _to_entity(model: InteresadoModel) -> Interesado:
        return Interesado(
            id=model.id,
            nombre_completo=model.nombre_completo,
            correo=model.correo,
            telefono=model.telefono,
            mensaje=model.mensaje,
            autoriza_tratamiento_datos=model.autoriza_tratamiento_datos,
            estado=EstadoInteresado(model.estado),
            fecha_registro=model.fecha_registro,
            fecha_ultimo_contacto=model.fecha_ultimo_contacto,
        )
