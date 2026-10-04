"""Adaptador del puerto AccesoGrupos: delega en los casos de uso del módulo grupos."""

from modules.contenidos.domain.ports import AccesoGrupos
from modules.grupos.infrastructure.dependencies import consultar_acceso_grupo
from shared.domain.actor import Actor


class AccesoGruposAdapter(AccesoGrupos):
    def __init__(self):
        self.consulta = consultar_acceso_grupo()

    def puede_gestionar(self, actor: Actor, grupo_id: int) -> bool:
        return self.consulta.puede_gestionar(actor, grupo_id)

    def puede_ver(self, actor: Actor, grupo_id: int) -> bool:
        return self.consulta.puede_ver(actor, grupo_id)
