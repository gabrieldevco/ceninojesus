from dataclasses import asdict, fields

from django.core.files.storage import default_storage

from modules.contenidos.domain.entities import Actividad, Contenido, Entrega, MaterialApoyo, TipoMaterial
from modules.contenidos.domain.ports import AlmacenArchivos, ContenidoRepository, EntregaRepository

from .models import ActividadModel, EntregaModel, MaterialApoyoModel


class _DjangoContenidoRepository(ContenidoRepository):
    model_class = None
    entidad = None

    def guardar(self, contenido: Contenido) -> Contenido:
        datos = asdict(contenido)
        contenido_id = datos.pop("id")
        model, _ = self.model_class.objects.update_or_create(id=contenido_id, defaults=datos)
        return self._to_entity(model)

    def obtener_por_id(self, contenido_id: int) -> Contenido | None:
        model = self.model_class.objects.filter(id=contenido_id).first()
        return self._to_entity(model) if model else None

    def listar(self, grupo_id: int, solo_publicados: bool = False) -> list[Contenido]:
        queryset = self.model_class.objects.filter(grupo_id=grupo_id)
        if solo_publicados:
            queryset = queryset.filter(publicado=True)
        return [self._to_entity(model) for model in queryset]

    def eliminar(self, contenido_id: int) -> None:
        self.model_class.objects.filter(id=contenido_id).delete()

    def _to_entity(self, model) -> Contenido:
        datos = {f.name: getattr(model, f.name) for f in fields(self.entidad) if f.name not in ("grupo_id", "autor_id")}
        datos["archivo"] = model.archivo.name or ""
        return self.entidad(grupo_id=model.grupo_id, autor_id=model.autor_id, **datos)


class DjangoMaterialRepository(_DjangoContenidoRepository):
    model_class = MaterialApoyoModel
    entidad = MaterialApoyo

    def _to_entity(self, model) -> MaterialApoyo:
        material = super()._to_entity(model)
        material.tipo = TipoMaterial(model.tipo)
        return material


class DjangoActividadRepository(_DjangoContenidoRepository):
    model_class = ActividadModel
    entidad = Actividad


class DjangoEntregaRepository(EntregaRepository):
    def guardar(self, entrega: Entrega) -> Entrega:
        datos = {
            "actividad_id": entrega.actividad_id,
            "estudiante_id": entrega.estudiante_usuario_id,
            "texto": entrega.texto,
            "archivo": entrega.archivo,
            "url": entrega.url,
            "fecha_entrega": entrega.fecha_entrega,
            "calificacion": entrega.calificacion,
            "comentario_docente": entrega.comentario_docente,
            "fecha_calificacion": entrega.fecha_calificacion,
        }
        model, _ = EntregaModel.objects.update_or_create(id=entrega.id, defaults=datos)
        return self.obtener_por_id(model.id)

    def obtener_por_id(self, entrega_id: int) -> Entrega | None:
        model = self._base().filter(id=entrega_id).first()
        return self._to_entity(model) if model else None

    def obtener_de_estudiante(self, actividad_id: int, estudiante_usuario_id: int) -> Entrega | None:
        model = self._base().filter(actividad_id=actividad_id, estudiante_id=estudiante_usuario_id).first()
        return self._to_entity(model) if model else None

    def listar_por_actividad(self, actividad_id: int) -> list[Entrega]:
        return [self._to_entity(model) for model in self._base().filter(actividad_id=actividad_id)]

    def listar_de_estudiante(self, estudiante_usuario_id: int, actividad_ids: list[int]) -> list[Entrega]:
        queryset = self._base().filter(estudiante_id=estudiante_usuario_id, actividad_id__in=actividad_ids)
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _base():
        return EntregaModel.objects.select_related("estudiante")

    @staticmethod
    def _to_entity(model: EntregaModel) -> Entrega:
        usuario = model.estudiante
        nombre = f"{usuario.nombres} {usuario.apellidos}".strip() or usuario.nombre_usuario
        return Entrega(
            id=model.id,
            actividad_id=model.actividad_id,
            estudiante_usuario_id=model.estudiante_id,
            texto=model.texto,
            archivo=model.archivo.name or "",
            url=model.url,
            fecha_entrega=model.fecha_entrega,
            calificacion=model.calificacion,
            comentario_docente=model.comentario_docente,
            fecha_calificacion=model.fecha_calificacion,
            estudiante_nombre=nombre,
        )


class DjangoAlmacenArchivos(AlmacenArchivos):
    def guardar(self, archivo, carpeta: str) -> str:
        return default_storage.save(f"{carpeta}/{archivo.name}", archivo)

    def eliminar(self, ruta: str) -> None:
        if ruta and default_storage.exists(ruta):
            default_storage.delete(ruta)
