"""Adaptador del puerto DirectorioUsuarios sobre las tablas del módulo usuarios."""

from django.contrib.auth import get_user_model

from modules.grupos.domain.entities import EstudianteResumen
from modules.grupos.domain.ports import DirectorioUsuarios
from modules.usuarios.infrastructure.models import EstudianteModel
from shared.domain.actor import Rol


class DjangoDirectorioUsuarios(DirectorioUsuarios):
    def obtener_estudiante(self, estudiante_id: int) -> EstudianteResumen | None:
        model = EstudianteModel.objects.filter(id=estudiante_id).first()
        return self._to_resumen(model) if model else None

    def estudiante_de_usuario(self, usuario_id: int) -> EstudianteResumen | None:
        model = EstudianteModel.objects.filter(usuario_id=usuario_id).first()
        return self._to_resumen(model) if model else None

    def estudiantes_de_acudiente(self, acudiente_id: int) -> list[EstudianteResumen]:
        return [self._to_resumen(model) for model in EstudianteModel.objects.filter(acudiente_id=acudiente_id)]

    def ids_con_rol(self, usuario_ids: list[int], rol: Rol) -> set[int]:
        usuarios = get_user_model().objects.filter(id__in=usuario_ids, rol=rol, is_active=True)
        return set(usuarios.values_list("id", flat=True))

    @staticmethod
    def _to_resumen(model: EstudianteModel) -> EstudianteResumen:
        return EstudianteResumen(
            id=model.id,
            nombre_completo=str(model),
            acudiente_id=model.acudiente_id,
            usuario_id=model.usuario_id,
            grado=model.grado,
        )
