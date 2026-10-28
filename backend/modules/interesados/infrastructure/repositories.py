"""Adaptadores de los puertos del módulo usando el ORM de Django."""

from dataclasses import asdict
from datetime import datetime

from django.db.models import Max

from modules.interesados.domain.entities import EstadoInteresado, Interesado, Seguimiento
from modules.interesados.domain.ports import InteresadoRepository, RecordatorioRepository, SeguimientoRepository

from .models import InteresadoModel, RecordatorioInteresadoModel, SeguimientoInteresadoModel


class DjangoInteresadoRepository(InteresadoRepository):
    def guardar(self, interesado: Interesado) -> Interesado:
        datos = asdict(interesado)
        interesado_id = datos.pop("id")
        model, _ = InteresadoModel.objects.update_or_create(id=interesado_id, defaults=datos)
        return self._to_entity(model)

    def obtener_por_id(self, interesado_id: int) -> Interesado | None:
        model = InteresadoModel.objects.filter(id=interesado_id).first()
        return self._to_entity(model) if model else None

    def listar(self, estado: EstadoInteresado | None = None) -> list[Interesado]:
        queryset = InteresadoModel.objects.all()
        if estado is not None:
            queryset = queryset.filter(estado=estado.value)
        return [self._to_entity(model) for model in queryset]

    def listar_pendientes(self) -> list[Interesado]:
        queryset = InteresadoModel.objects.filter(estado__in=[EstadoInteresado.NUEVO, EstadoInteresado.EN_SEGUIMIENTO])
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _to_entity(model: InteresadoModel) -> Interesado:
        return Interesado(
            id=model.id,
            nombre_completo=model.nombre_completo,
            correo=model.correo,
            telefono=model.telefono,
            mensaje=model.mensaje,
            nombre_aspirante=model.nombre_aspirante,
            grado_interes=model.grado_interes,
            autoriza_tratamiento_datos=model.autoriza_tratamiento_datos,
            estado=EstadoInteresado(model.estado),
            fecha_registro=model.fecha_registro,
            fecha_ultimo_contacto=model.fecha_ultimo_contacto,
        )


class DjangoSeguimientoRepository(SeguimientoRepository):
    def guardar(self, seguimiento: Seguimiento) -> Seguimiento:
        datos = asdict(seguimiento)
        seguimiento_id = datos.pop("id")
        model, _ = SeguimientoInteresadoModel.objects.update_or_create(id=seguimiento_id, defaults=datos)
        return self._to_entity(model)

    def listar(self, interesado_id: int) -> list[Seguimiento]:
        queryset = SeguimientoInteresadoModel.objects.filter(interesado_id=interesado_id)
        return [self._to_entity(model) for model in queryset]

    def eliminar_de(self, interesado_id: int) -> None:
        SeguimientoInteresadoModel.objects.filter(interesado_id=interesado_id).delete()

    @staticmethod
    def _to_entity(model: SeguimientoInteresadoModel) -> Seguimiento:
        return Seguimiento(
            id=model.id,
            interesado_id=model.interesado_id,
            usuario_id=model.usuario_id,
            nota=model.nota,
            fecha=model.fecha,
        )


class DjangoRecordatorioRepository(RecordatorioRepository):
    def registrar(self, interesado_ids: list[int], fecha: datetime) -> None:
        RecordatorioInteresadoModel.objects.bulk_create(
            [RecordatorioInteresadoModel(interesado_id=i, fecha_envio=fecha) for i in interesado_ids]
        )

    def ultimos(self, interesado_ids: list[int]) -> dict[int, datetime]:
        filas = (
            RecordatorioInteresadoModel.objects.filter(interesado_id__in=interesado_ids)
            .values("interesado_id")
            .annotate(ultimo=Max("fecha_envio"))
        )
        return {fila["interesado_id"]: fila["ultimo"] for fila in filas}
