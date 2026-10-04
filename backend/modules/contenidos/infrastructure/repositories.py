from dataclasses import asdict, fields

from django.core.files.storage import default_storage

from modules.contenidos.domain.entities import Actividad, Contenido, MaterialApoyo, TipoMaterial
from modules.contenidos.domain.ports import AlmacenArchivos, ContenidoRepository

from .models import ActividadModel, MaterialApoyoModel


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


class DjangoAlmacenArchivos(AlmacenArchivos):
    def guardar(self, archivo, carpeta: str) -> str:
        return default_storage.save(f"{carpeta}/{archivo.name}", archivo)

    def eliminar(self, ruta: str) -> None:
        if ruta and default_storage.exists(ruta):
            default_storage.delete(ruta)
