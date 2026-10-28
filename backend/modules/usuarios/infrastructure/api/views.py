import contextlib

from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from modules.grupos.infrastructure import dependencies as grupos
from modules.grupos.infrastructure.api.serializers import SolicitudSerializer
from modules.usuarios.application.use_cases import DatosEstudiante, DatosUsuario
from modules.usuarios.infrastructure import dependencies
from shared.domain.actor import Rol
from shared.infrastructure.bloqueo import BloqueoPorIntentos
from shared.infrastructure.permissions import EsAdministrador, actor_desde_request, roles_permitidos
from shared.infrastructure.throttling import LimiteEnvios

from . import serializers as s

MENSAJE_RECUPERACION = (
    "Si los datos corresponden a una cuenta con correo registrado, enviamos un enlace para restablecer la contraseña."
)


class _Autenticacion:
    """Vistas públicas sensibles a fuerza bruta: límite de intentos por IP."""

    permission_classes = [AllowAny]
    throttle_classes = [LimiteEnvios]
    throttle_scope = "autenticacion"


class IniciarSesionView(_Autenticacion, TokenObtainPairView):
    """Inicio de sesión con bloqueo temporal tras demasiados intentos fallidos de la misma cuenta."""

    def post(self, request, *args, **kwargs):
        bloqueo = BloqueoPorIntentos(str(request.data.get("nombre_usuario", "")), self.get_client_ip(request))
        if bloqueo.bloqueado:
            return Response(
                {"detail": "Demasiados intentos fallidos. Intente de nuevo en unos minutos."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        try:
            respuesta = super().post(request, *args, **kwargs)
        except AuthenticationFailed:
            bloqueo.registrar_fallo()
            raise
        bloqueo.reiniciar()
        return respuesta

    @staticmethod
    def get_client_ip(request) -> str:
        # Con NUM_PROXIES configurado, DRF resuelve la IP real detrás de Caddy
        return LimiteEnvios().get_ident(request)


class CerrarSesionView(APIView):
    """Revoca el refresh token: deja de poder renovar la sesión."""

    permission_classes = [AllowAny]  # el propio refresh es la credencial; el access puede haber vencido

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"refresh": ["Este campo es obligatorio."]}, status=status.HTTP_400_BAD_REQUEST)
        with contextlib.suppress(TokenError):  # ya vencido o revocado: el resultado es el mismo
            RefreshToken(refresh).blacklist()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegistroAcudienteView(APIView):
    """Registro público de padres/acudientes."""

    permission_classes = [AllowAny]
    throttle_classes = [LimiteEnvios]
    throttle_scope = "formularios"

    def post(self, request):
        serializer = s.RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = dependencies.registrar_acudiente().execute(DatosUsuario(**serializer.validated_data))
        return Response(s.UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)


class SolicitarRecuperacionView(_Autenticacion, APIView):
    def post(self, request):
        serializer = s.SolicitarRecuperacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dependencies.solicitar_recuperacion().execute(serializer.validated_data["identificador"])
        # Misma respuesta exista o no la cuenta, para no revelar qué usuarios hay
        return Response({"detail": MENSAJE_RECUPERACION})


class ConfirmarRecuperacionView(_Autenticacion, APIView):
    def post(self, request):
        serializer = s.ConfirmarRecuperacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dependencies.confirmar_recuperacion().execute(**serializer.validated_data)
        return Response({"detail": "La contraseña se cambió. Ya puede iniciar sesión."})


class PerfilView(APIView):
    """Datos del usuario autenticado (consulta y rectificación)."""

    def get(self, request):
        usuario = dependencies.obtener_usuario().execute(request.user.id)
        return Response(s.UsuarioSerializer(usuario).data)

    def patch(self, request):
        serializer = s.ActualizarPerfilSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = dependencies.actualizar_usuario().execute(
            actor_desde_request(request), request.user.id, serializer.validated_data
        )
        return Response(s.UsuarioSerializer(usuario).data)


class CambiarContrasenaView(APIView):
    def post(self, request):
        serializer = s.CambiarContrasenaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dependencies.cambiar_contrasena().execute(
            actor_desde_request(request),
            serializer.validated_data["password_actual"],
            serializer.validated_data["password_nueva"],
        )
        return Response({"detail": "La contraseña se cambió."})


class MisDatosView(APIView):
    """Ley 1581, derecho de consulta: todos los datos personales que el sistema guarda del usuario."""

    def get(self, request):
        actor = actor_desde_request(request)
        datos = {"perfil": s.UsuarioSerializer(dependencies.obtener_usuario().execute(actor.id)).data}
        if actor.rol == Rol.ACUDIENTE:
            estudiantes = dependencies.listar_estudiantes().execute(actor)
            solicitudes = grupos.listar_solicitudes().execute(actor)
            datos["estudiantes"] = s.EstudianteSerializer(estudiantes, many=True).data
            datos["solicitudes_matricula"] = SolicitudSerializer(solicitudes, many=True).data
        return Response(datos)


class UsuarioListCreateView(APIView):
    """RF-20: gestión de usuarios y roles por el administrador."""

    permission_classes = [EsAdministrador]

    def get(self, request):
        rol = request.query_params.get("rol")
        usuarios = dependencies.listar_usuarios().execute(Rol(rol) if rol in Rol else None)
        return Response(s.UsuarioSerializer(usuarios, many=True).data)

    def post(self, request):
        serializer = s.CrearUsuarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = dict(serializer.validated_data)
        rol = Rol(datos.pop("rol"))
        usuario = dependencies.crear_usuario().execute(DatosUsuario(**datos), rol)
        return Response(s.UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)


class UsuarioDetailView(APIView):
    permission_classes = [EsAdministrador]

    def get(self, request, usuario_id):
        usuario = dependencies.obtener_usuario().execute(usuario_id)
        return Response(s.UsuarioSerializer(usuario).data)

    def patch(self, request, usuario_id):
        serializer = s.ActualizarUsuarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = dependencies.actualizar_usuario().execute(
            actor_desde_request(request), usuario_id, serializer.validated_data
        )
        return Response(s.UsuarioSerializer(usuario).data)


class AnonimizarUsuarioView(APIView):
    """Ley 1581, derecho de supresión: lo ejecuta el administrador al atender la solicitud."""

    permission_classes = [EsAdministrador]

    def post(self, request, usuario_id):
        usuario = dependencies.anonimizar_usuario().execute(usuario_id)
        return Response(s.UsuarioSerializer(usuario).data)


class EstudianteListCreateView(APIView):
    permission_classes = [roles_permitidos(Rol.ADMINISTRADOR, Rol.ACUDIENTE)]

    def get(self, request):
        estudiantes = dependencies.listar_estudiantes().execute(actor_desde_request(request))
        return Response(s.EstudianteSerializer(estudiantes, many=True).data)

    def post(self, request):
        serializer = s.RegistrarEstudianteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        estudiante = dependencies.registrar_estudiante().execute(
            actor_desde_request(request), DatosEstudiante(**serializer.validated_data)
        )
        return Response(s.EstudianteSerializer(estudiante).data, status=status.HTTP_201_CREATED)


class EstudianteDetailView(APIView):
    permission_classes = [roles_permitidos(Rol.ADMINISTRADOR, Rol.ACUDIENTE)]

    def patch(self, request, estudiante_id):
        serializer = s.ActualizarEstudianteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        estudiante = dependencies.actualizar_estudiante().execute(
            actor_desde_request(request), estudiante_id, serializer.validated_data
        )
        return Response(s.EstudianteSerializer(estudiante).data)


class AccesoEstudianteView(APIView):
    permission_classes = [roles_permitidos(Rol.ADMINISTRADOR, Rol.ACUDIENTE)]

    def post(self, request, estudiante_id):
        serializer = s.AccesoEstudianteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        estudiante = dependencies.crear_acceso_estudiante().execute(
            actor_desde_request(request), estudiante_id, **serializer.validated_data
        )
        return Response(s.EstudianteSerializer(estudiante).data, status=status.HTTP_201_CREATED)


class ContrasenaEstudianteView(APIView):
    permission_classes = [roles_permitidos(Rol.ADMINISTRADOR, Rol.ACUDIENTE)]

    def post(self, request, estudiante_id):
        serializer = s.NuevaContrasenaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dependencies.restablecer_contrasena_estudiante().execute(
            actor_desde_request(request), estudiante_id, serializer.validated_data["password"]
        )
        return Response({"detail": "La contraseña del estudiante se cambió."})
