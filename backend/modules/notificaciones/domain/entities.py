from dataclasses import dataclass, field
from datetime import UTC, datetime

from shared.domain.actor import Actor
from shared.domain.exceptions import PermisoDenegado


@dataclass
class Notificacion:
    usuario_id: int
    titulo: str
    mensaje: str
    leida: bool = False
    fecha_creacion: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: int | None = None

    def marcar_leida(self, actor: Actor):
        if actor.id != self.usuario_id:
            raise PermisoDenegado("La notificación pertenece a otro usuario.")
        self.leida = True
