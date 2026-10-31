from dataclasses import asdict

from django.core.files.storage import default_storage

from modules.institucional.domain.entities import (
    ElementoLanding,
    EnlacePortal,
    InformacionInstitucional,
    MensajeContacto,
    SeccionLanding,
    TipoEnlace,
)
from modules.institucional.domain.ports import (
    ElementoLandingRepository,
    EnlaceRepository,
    InformacionRepository,
    MensajeContactoRepository,
)

from .models import ElementoLandingModel, EnlacePortalModel, InformacionInstitucionalModel, MensajeContactoModel


class DjangoInformacionRepository(InformacionRepository):
    def obtener(self) -> InformacionInstitucional | None:
        model = InformacionInstitucionalModel.objects.first()
        if model is None:
            return None
        return InformacionInstitucional(**{campo: getattr(model, campo) for campo in self._campos()})

    def guardar(self, informacion: InformacionInstitucional) -> InformacionInstitucional:
        model = InformacionInstitucionalModel.objects.first() or InformacionInstitucionalModel()
        for campo, valor in asdict(informacion).items():
            setattr(model, campo, valor)
        model.save()
        return self.obtener()

    @staticmethod
    def _campos():
        return InformacionInstitucional.__dataclass_fields__.keys()


class DjangoEnlaceRepository(EnlaceRepository):
    def guardar(self, enlace: EnlacePortal) -> EnlacePortal:
        datos = asdict(enlace)
        enlace_id = datos.pop("id")
        model, _ = EnlacePortalModel.objects.update_or_create(id=enlace_id, defaults=datos)
        return self._to_entity(model)

    def obtener_por_id(self, enlace_id: int) -> EnlacePortal | None:
        model = EnlacePortalModel.objects.filter(id=enlace_id).first()
        return self._to_entity(model) if model else None

    def listar(self) -> list[EnlacePortal]:
        return [self._to_entity(model) for model in EnlacePortalModel.objects.all()]

    def eliminar(self, enlace_id: int) -> None:
        EnlacePortalModel.objects.filter(id=enlace_id).delete()

    @staticmethod
    def _to_entity(model: EnlacePortalModel) -> EnlacePortal:
        return EnlacePortal(
            id=model.id,
            nombre=model.nombre,
            url=model.url,
            tipo=TipoEnlace(model.tipo),
            descripcion=model.descripcion,
            requiere_autenticacion=model.requiere_autenticacion,
            orden=model.orden,
            activo=model.activo,
        )


class DjangoMensajeContactoRepository(MensajeContactoRepository):
    def guardar(self, mensaje: MensajeContacto) -> MensajeContacto:
        datos = asdict(mensaje)
        mensaje_id = datos.pop("id")
        model, _ = MensajeContactoModel.objects.update_or_create(id=mensaje_id, defaults=datos)
        return self._to_entity(model)

    def obtener_por_id(self, mensaje_id: int) -> MensajeContacto | None:
        model = MensajeContactoModel.objects.filter(id=mensaje_id).first()
        return self._to_entity(model) if model else None

    def listar(self, solo_no_leidos: bool = False) -> list[MensajeContacto]:
        queryset = MensajeContactoModel.objects.all()
        if solo_no_leidos:
            queryset = queryset.filter(leido=False)
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _to_entity(model: MensajeContactoModel) -> MensajeContacto:
        return MensajeContacto(
            id=model.id,
            nombre=model.nombre,
            correo=model.correo,
            telefono=model.telefono,
            asunto=model.asunto,
            mensaje=model.mensaje,
            autoriza_tratamiento_datos=model.autoriza_tratamiento_datos,
            leido=model.leido,
            fecha_envio=model.fecha_envio,
        )


class DjangoElementoLandingRepository(ElementoLandingRepository):
    def guardar(self, elemento: ElementoLanding) -> ElementoLanding:
        campos = {
            "seccion": elemento.seccion.value,
            "titulo": elemento.titulo,
            "texto": elemento.texto,
            "detalle": elemento.detalle,
            "icono": elemento.icono,
            "imagen_estatica": elemento.imagen_estatica,
            "orden": elemento.orden,
            "activo": elemento.activo,
        }
        model, _ = ElementoLandingModel.objects.update_or_create(id=elemento.id, defaults=campos)
        return self._to_entity(model)

    def obtener_por_id(self, elemento_id: int) -> ElementoLanding | None:
        model = ElementoLandingModel.objects.filter(id=elemento_id).first()
        return self._to_entity(model) if model else None

    def listar(self, seccion: SeccionLanding | None = None) -> list[ElementoLanding]:
        queryset = ElementoLandingModel.objects.all()
        if seccion is not None:
            queryset = queryset.filter(seccion=seccion.value)
        return [self._to_entity(model) for model in queryset]

    def obtener_unico(self, seccion: SeccionLanding) -> ElementoLanding | None:
        model = ElementoLandingModel.objects.filter(seccion=seccion.value).first()
        return self._to_entity(model) if model else None

    def eliminar(self, elemento_id: int) -> None:
        model = ElementoLandingModel.objects.filter(id=elemento_id).first()
        if model is None:
            return
        if model.imagen:
            model.imagen.delete(save=False)
        model.delete()

    def guardar_imagen(self, elemento_id: int, archivo) -> ElementoLanding:
        model = ElementoLandingModel.objects.get(id=elemento_id)
        if model.imagen:
            model.imagen.delete(save=False)
        model.imagen.save(archivo.name, archivo, save=True)
        return self._to_entity(model)

    def quitar_imagen(self, elemento_id: int) -> ElementoLanding:
        model = ElementoLandingModel.objects.get(id=elemento_id)
        if model.imagen:
            model.imagen.delete(save=False)
            model.imagen = ""
            model.save()
        return self._to_entity(model)

    def ruta_imagen(self, elemento_id: int) -> str | None:
        model = ElementoLandingModel.objects.filter(id=elemento_id).first()
        if model is None or not model.imagen or not default_storage.exists(model.imagen.name):
            return None
        return model.imagen.name

    @staticmethod
    def _to_entity(model: ElementoLandingModel) -> ElementoLanding:
        return ElementoLanding(
            id=model.id,
            seccion=SeccionLanding(model.seccion),
            titulo=model.titulo,
            texto=model.texto,
            detalle=model.detalle,
            icono=model.icono,
            imagen_estatica=model.imagen_estatica,
            tiene_imagen_subida=bool(model.imagen),
            orden=model.orden,
            activo=model.activo,
            actualizado=model.actualizado,
        )
