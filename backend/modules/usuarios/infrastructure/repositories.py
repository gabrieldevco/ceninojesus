from django.contrib.auth.tokens import default_token_generator
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from modules.usuarios.domain.entities import Estudiante, Usuario
from modules.usuarios.domain.ports import EstudianteRepository, TokensRecuperacion, UsuarioRepository
from shared.domain.actor import Rol

from .models import EstudianteModel
from .models import Usuario as UsuarioModel


class DjangoUsuarioRepository(UsuarioRepository):
    def crear(self, usuario: Usuario, password: str) -> Usuario:
        model = UsuarioModel.objects.create_user(
            nombre_usuario=usuario.nombre_usuario,
            correo=usuario.correo,
            password=password,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            telefono=usuario.telefono,
            rol=usuario.rol,
            is_active=usuario.activo,
            fecha_autorizacion_datos=usuario.fecha_autorizacion_datos,
        )
        return self._to_entity(model)

    def actualizar(self, usuario: Usuario) -> Usuario:
        model = UsuarioModel.objects.get(id=usuario.id)
        model.nombre_usuario = usuario.nombre_usuario
        model.correo = usuario.correo
        model.nombres = usuario.nombres
        model.apellidos = usuario.apellidos
        model.telefono = usuario.telefono
        model.rol = usuario.rol
        model.is_active = usuario.activo
        model.fecha_autorizacion_datos = usuario.fecha_autorizacion_datos
        model.save()
        return self._to_entity(model)

    def obtener_por_id(self, usuario_id: int) -> Usuario | None:
        model = UsuarioModel.objects.filter(id=usuario_id).first()
        return self._to_entity(model) if model else None

    def existe_nombre_usuario(self, nombre_usuario: str) -> bool:
        return UsuarioModel.objects.filter(nombre_usuario__iexact=nombre_usuario).exists()

    def listar(self, rol: Rol | None = None) -> list[Usuario]:
        queryset = UsuarioModel.objects.order_by("nombre_usuario")
        if rol is not None:
            queryset = queryset.filter(rol=rol)
        return [self._to_entity(model) for model in queryset]

    def buscar_para_recuperacion(self, identificador: str) -> list[Usuario]:
        if not identificador:
            return []
        queryset = UsuarioModel.objects.filter(
            Q(nombre_usuario__iexact=identificador) | Q(correo__iexact=identificador), is_active=True
        )
        return [self._to_entity(model) for model in queryset]

    def verificar_password(self, usuario_id: int, password: str) -> bool:
        return UsuarioModel.objects.get(id=usuario_id).check_password(password)

    def cambiar_password(self, usuario_id: int, password: str) -> None:
        model = UsuarioModel.objects.get(id=usuario_id)
        model.set_password(password)
        model.save(update_fields=["password"])

    def inhabilitar_acceso(self, usuario_id: int) -> None:
        model = UsuarioModel.objects.get(id=usuario_id)
        model.set_unusable_password()
        model.save(update_fields=["password"])

    @staticmethod
    def _to_entity(model: UsuarioModel) -> Usuario:
        return Usuario(
            id=model.id,
            nombre_usuario=model.nombre_usuario,
            rol=Rol(model.rol),
            correo=model.correo,
            nombres=model.nombres,
            apellidos=model.apellidos,
            telefono=model.telefono,
            activo=model.is_active,
            fecha_autorizacion_datos=model.fecha_autorizacion_datos,
        )


class DjangoEstudianteRepository(EstudianteRepository):
    def guardar(self, estudiante: Estudiante) -> Estudiante:
        model, _ = EstudianteModel.objects.update_or_create(
            id=estudiante.id,
            defaults={
                "nombres": estudiante.nombres,
                "apellidos": estudiante.apellidos,
                "documento_identidad": estudiante.documento_identidad,
                "fecha_nacimiento": estudiante.fecha_nacimiento,
                "grado": estudiante.grado,
                "acudiente_id": estudiante.acudiente_id,
                "usuario_id": estudiante.usuario_id,
                "fecha_autorizacion_datos": estudiante.fecha_autorizacion_datos,
            },
        )
        return self._to_entity(model)

    def obtener_por_id(self, estudiante_id: int) -> Estudiante | None:
        model = EstudianteModel.objects.filter(id=estudiante_id).first()
        return self._to_entity(model) if model else None

    def listar(self, acudiente_id: int | None = None) -> list[Estudiante]:
        queryset = EstudianteModel.objects.all()
        if acudiente_id is not None:
            queryset = queryset.filter(acudiente_id=acudiente_id)
        return [self._to_entity(model) for model in queryset]

    @staticmethod
    def _to_entity(model: EstudianteModel) -> Estudiante:
        return Estudiante(
            id=model.id,
            nombres=model.nombres,
            apellidos=model.apellidos,
            acudiente_id=model.acudiente_id,
            documento_identidad=model.documento_identidad,
            fecha_nacimiento=model.fecha_nacimiento,
            grado=model.grado,
            usuario_id=model.usuario_id,
            fecha_autorizacion_datos=model.fecha_autorizacion_datos,
        )


class DjangoTokensRecuperacion(TokensRecuperacion):
    """
    Usa el generador de Django: el token caduca (PASSWORD_RESET_TIMEOUT) y deja de
    servir en cuanto se cambia la contraseña, así que es de un solo uso.
    """

    def generar(self, usuario_id: int) -> tuple[str, str]:
        model = UsuarioModel.objects.get(id=usuario_id)
        return urlsafe_base64_encode(force_bytes(model.pk)), default_token_generator.make_token(model)

    def validar(self, uid: str, token: str) -> int | None:
        try:
            model = UsuarioModel.objects.get(pk=force_str(urlsafe_base64_decode(uid)), is_active=True)
        except UsuarioModel.DoesNotExist, ValueError, TypeError, OverflowError:
            return None
        return model.id if default_token_generator.check_token(model, token) else None
