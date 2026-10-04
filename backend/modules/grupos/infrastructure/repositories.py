from django.db import transaction

from modules.grupos.domain.entities import EstadoSolicitud, GrupoExtracurricular, SolicitudMatricula
from modules.grupos.domain.ports import GrupoRepository, SolicitudRepository

from .models import GrupoAdministradorModel, GrupoExtracurricularModel, SolicitudMatriculaModel


class DjangoGrupoRepository(GrupoRepository):
    @transaction.atomic
    def guardar(self, grupo: GrupoExtracurricular) -> GrupoExtracurricular:
        model, _ = GrupoExtracurricularModel.objects.update_or_create(
            id=grupo.id,
            defaults={
                "nombre": grupo.nombre,
                "descripcion": grupo.descripcion,
                "horario": grupo.horario,
                "cupo_maximo": grupo.cupo_maximo,
                "activo": grupo.activo,
            },
        )
        actuales = set(model.administradores.values_list("id", flat=True))
        nuevos = set(grupo.administrador_ids)
        GrupoAdministradorModel.objects.filter(grupo=model, usuario_id__in=actuales - nuevos).delete()
        GrupoAdministradorModel.objects.bulk_create(
            [GrupoAdministradorModel(grupo=model, usuario_id=usuario_id) for usuario_id in nuevos - actuales]
        )
        return self.obtener_por_id(model.id)

    def obtener_por_id(self, grupo_id: int) -> GrupoExtracurricular | None:
        model = self._queryset().filter(id=grupo_id).first()
        return self._to_entity(model) if model else None

    def listar(self, solo_activos=False, administrador_id=None, ids=None) -> list[GrupoExtracurricular]:
        queryset = self._queryset()
        if solo_activos:
            queryset = queryset.filter(activo=True)
        if administrador_id is not None:
            queryset = queryset.filter(administradores__id=administrador_id)
        if ids is not None:
            queryset = queryset.filter(id__in=ids)
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _queryset():
        return GrupoExtracurricularModel.objects.prefetch_related("administradores")

    @staticmethod
    def _to_entity(model: GrupoExtracurricularModel) -> GrupoExtracurricular:
        return GrupoExtracurricular(
            id=model.id,
            nombre=model.nombre,
            descripcion=model.descripcion,
            horario=model.horario,
            cupo_maximo=model.cupo_maximo,
            activo=model.activo,
            administrador_ids=sorted(a.id for a in model.administradores.all()),
        )


class DjangoSolicitudRepository(SolicitudRepository):
    def guardar(self, solicitud: SolicitudMatricula) -> SolicitudMatricula:
        model, _ = SolicitudMatriculaModel.objects.update_or_create(
            id=solicitud.id,
            defaults={
                "grupo_id": solicitud.grupo_id,
                "estudiante_id": solicitud.estudiante_id,
                "acudiente_id": solicitud.acudiente_id,
                "comentario": solicitud.comentario,
                "estado": solicitud.estado.value,
                "respuesta": solicitud.respuesta,
                "fecha_solicitud": solicitud.fecha_solicitud,
                "fecha_respuesta": solicitud.fecha_respuesta,
                "respondida_por_id": solicitud.respondida_por_id,
            },
        )
        return self.obtener_por_id(model.id)

    def obtener_por_id(self, solicitud_id: int) -> SolicitudMatricula | None:
        model = self._queryset().filter(id=solicitud_id).first()
        return self._to_entity(model) if model else None

    def listar(self, grupo_ids=None, acudiente_id=None, estudiante_ids=None, estado=None) -> list[SolicitudMatricula]:
        queryset = self._queryset()
        if grupo_ids is not None:
            queryset = queryset.filter(grupo_id__in=grupo_ids)
        if acudiente_id is not None:
            queryset = queryset.filter(acudiente_id=acudiente_id)
        if estudiante_ids is not None:
            queryset = queryset.filter(estudiante_id__in=estudiante_ids)
        if estado is not None:
            queryset = queryset.filter(estado=estado.value)
        return [self._to_entity(model) for model in queryset]

    def existe_activa(self, estudiante_id: int, grupo_id: int) -> bool:
        return SolicitudMatriculaModel.objects.filter(
            estudiante_id=estudiante_id,
            grupo_id=grupo_id,
            estado__in=[EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA],
        ).exists()

    def contar_aprobadas(self, grupo_id: int) -> int:
        return SolicitudMatriculaModel.objects.filter(grupo_id=grupo_id, estado=EstadoSolicitud.APROBADA).count()

    @staticmethod
    def _queryset():
        return SolicitudMatriculaModel.objects.select_related("grupo", "estudiante")

    @staticmethod
    def _to_entity(model: SolicitudMatriculaModel) -> SolicitudMatricula:
        return SolicitudMatricula(
            id=model.id,
            grupo_id=model.grupo_id,
            estudiante_id=model.estudiante_id,
            acudiente_id=model.acudiente_id,
            comentario=model.comentario,
            estado=EstadoSolicitud(model.estado),
            respuesta=model.respuesta,
            fecha_solicitud=model.fecha_solicitud,
            fecha_respuesta=model.fecha_respuesta,
            respondida_por_id=model.respondida_por_id,
            grupo_nombre=model.grupo.nombre,
            estudiante_nombre=str(model.estudiante),
        )
