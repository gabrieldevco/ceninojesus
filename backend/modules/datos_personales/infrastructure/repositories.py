from dataclasses import asdict

from modules.datos_personales.domain.entities import EstadoSolicitudDatos, SolicitudDatos, TipoSolicitudDatos
from modules.datos_personales.domain.ports import SolicitudDatosRepository

from .models import SolicitudDatosModel


class DjangoSolicitudDatosRepository(SolicitudDatosRepository):
    def guardar(self, solicitud: SolicitudDatos) -> SolicitudDatos:
        datos = asdict(solicitud)
        solicitud_id = datos.pop("id")
        model, _ = SolicitudDatosModel.objects.update_or_create(id=solicitud_id, defaults=datos)
        return self._to_entity(model)

    def obtener_por_id(self, solicitud_id: int) -> SolicitudDatos | None:
        model = SolicitudDatosModel.objects.filter(id=solicitud_id).first()
        return self._to_entity(model) if model else None

    def listar(self, estado: EstadoSolicitudDatos | None = None) -> list[SolicitudDatos]:
        queryset = SolicitudDatosModel.objects.all()
        if estado is not None:
            queryset = queryset.filter(estado=estado.value)
        return [self._to_entity(model) for model in queryset]

    def listar_sin_resolver(self) -> list[SolicitudDatos]:
        queryset = SolicitudDatosModel.objects.exclude(estado=EstadoSolicitudDatos.RESUELTA)
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _to_entity(model: SolicitudDatosModel) -> SolicitudDatos:
        return SolicitudDatos(
            id=model.id,
            nombre=model.nombre,
            correo=model.correo,
            documento_identidad=model.documento_identidad,
            tipo=TipoSolicitudDatos(model.tipo),
            descripcion=model.descripcion,
            usuario_id=model.usuario_id,
            estado=EstadoSolicitudDatos(model.estado),
            respuesta=model.respuesta,
            fecha_solicitud=model.fecha_solicitud,
            fecha_limite=model.fecha_limite,
            fecha_respuesta=model.fecha_respuesta,
            atendida_por_id=model.atendida_por_id,
            fecha_ultima_alerta=model.fecha_ultima_alerta,
        )
