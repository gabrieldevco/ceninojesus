"""Casos de uso de usuarios, roles (RF-06, RF-20), estudiantes y derechos sobre los datos (RNF-10)."""

from dataclasses import dataclass, replace
from datetime import UTC, date, datetime

from modules.usuarios.domain.entities import Estudiante, Usuario
from modules.usuarios.domain.exceptions import (
    AcudienteInvalido,
    AutorizacionDatosRequerida,
    ContrasenaIncorrecta,
    EnlaceRecuperacionInvalido,
    EstudianteNoEncontrado,
    EstudianteSinAcceso,
    EstudianteYaTieneAcceso,
    NombreUsuarioEnUso,
    UsuarioNoEncontrado,
)
from modules.usuarios.domain.ports import EstudianteRepository, TokensRecuperacion, UsuarioRepository
from shared.domain.actor import Actor, Rol
from shared.domain.exceptions import PermisoDenegado
from shared.domain.notificaciones import EnviadorCorreo


def _ahora():
    return datetime.now(UTC)


@dataclass(frozen=True)
class DatosUsuario:
    nombre_usuario: str
    password: str
    correo: str = ""
    nombres: str = ""
    apellidos: str = ""
    telefono: str = ""
    autoriza_tratamiento_datos: bool = False


def _crear_usuario(repository: UsuarioRepository, datos: DatosUsuario, rol: Rol) -> Usuario:
    if repository.existe_nombre_usuario(datos.nombre_usuario):
        raise NombreUsuarioEnUso(datos.nombre_usuario)
    usuario = Usuario(
        nombre_usuario=datos.nombre_usuario,
        rol=rol,
        correo=datos.correo,
        nombres=datos.nombres,
        apellidos=datos.apellidos,
        telefono=datos.telefono,
        fecha_autorizacion_datos=_ahora() if datos.autoriza_tratamiento_datos else None,
    )
    return repository.crear(usuario, datos.password)


class RegistrarAcudiente:
    """Registro público de padres/acudientes, requisito para solicitar matrículas (RF-07)."""

    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, datos: DatosUsuario) -> Usuario:
        # Ley 1581 de 2012 (RNF-10)
        if not datos.autoriza_tratamiento_datos:
            raise AutorizacionDatosRequerida()
        return _crear_usuario(self.repository, datos, Rol.ACUDIENTE)


class CrearUsuario:
    """RF-20: el administrador crea usuarios con cualquier rol."""

    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, datos: DatosUsuario, rol: Rol) -> Usuario:
        return _crear_usuario(self.repository, datos, rol)


class ListarUsuarios:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, rol: Rol | None = None) -> list[Usuario]:
        return self.repository.listar(rol)


class ObtenerUsuario:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, usuario_id: int) -> Usuario:
        usuario = self.repository.obtener_por_id(usuario_id)
        if usuario is None:
            raise UsuarioNoEncontrado(usuario_id)
        return usuario


CAMPOS_PERFIL = {"correo", "nombres", "apellidos", "telefono"}
CAMPOS_ADMINISTRACION = CAMPOS_PERFIL | {"rol", "activo"}


class ActualizarUsuario:
    """RF-20: el administrador cambia datos, rol o estado; cada usuario, solo su perfil (rectificación)."""

    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, actor: Actor, usuario_id: int, cambios: dict) -> Usuario:
        permitidos = CAMPOS_ADMINISTRACION if actor.es_administrador else CAMPOS_PERFIL
        if not actor.es_administrador and actor.id != usuario_id:
            raise PermisoDenegado()
        if set(cambios) - permitidos:
            raise PermisoDenegado(f"No puede modificar: {', '.join(sorted(set(cambios) - permitidos))}.")
        usuario = ObtenerUsuario(self.repository).execute(usuario_id)
        return self.repository.actualizar(replace(usuario, **cambios))


# --- Contraseñas ---


class SolicitarRecuperacion:
    """
    Envía un enlace para restablecer la contraseña a las cuentas que coincidan.
    No revela si la cuenta existe: el resultado es el mismo en ambos casos.
    """

    def __init__(
        self, repository: UsuarioRepository, tokens: TokensRecuperacion, correo: EnviadorCorreo, url_frontend: str
    ):
        self.repository = repository
        self.tokens = tokens
        self.correo = correo
        self.url_frontend = url_frontend

    def execute(self, identificador: str) -> None:
        for usuario in self.repository.buscar_para_recuperacion(identificador.strip()):
            if not usuario.correo:
                continue
            uid, token = self.tokens.generar(usuario.id)
            enlace = f"{self.url_frontend}/restablecer-contrasena?uid={uid}&token={token}"
            self.correo.enviar(
                [usuario.correo],
                "Restablecer contraseña - Centro Educativo El Niño Jesús",
                f"Hola {usuario.nombres or usuario.nombre_usuario}:\n\n"
                f"Recibimos una solicitud para restablecer la contraseña del usuario '{usuario.nombre_usuario}'.\n"
                f"Para crear una nueva contraseña ingrese a este enlace (válido por 2 horas):\n\n{enlace}\n\n"
                "Si usted no hizo esta solicitud, ignore este mensaje.",
            )


class ConfirmarRecuperacion:
    def __init__(self, repository: UsuarioRepository, tokens: TokensRecuperacion):
        self.repository = repository
        self.tokens = tokens

    def execute(self, uid: str, token: str, password: str) -> None:
        usuario_id = self.tokens.validar(uid, token)
        if usuario_id is None:
            raise EnlaceRecuperacionInvalido()
        self.repository.cambiar_password(usuario_id, password)


class CambiarContrasena:
    def __init__(self, repository: UsuarioRepository):
        self.repository = repository

    def execute(self, actor: Actor, actual: str, nueva: str) -> None:
        if not self.repository.verificar_password(actor.id, actual):
            raise ContrasenaIncorrecta()
        self.repository.cambiar_password(actor.id, nueva)


# --- Estudiantes ---


@dataclass(frozen=True)
class DatosEstudiante:
    nombres: str
    apellidos: str
    documento_identidad: str = ""
    fecha_nacimiento: date | None = None
    grado: str = ""
    acudiente_id: int | None = None
    autoriza_tratamiento_datos: bool = False


class RegistrarEstudiante:
    """El acudiente registra a sus hijos; el administrador puede hacerlo indicando el acudiente."""

    def __init__(self, repository: EstudianteRepository, usuarios: UsuarioRepository):
        self.repository = repository
        self.usuarios = usuarios

    def execute(self, actor: Actor, datos: DatosEstudiante) -> Estudiante:
        # Datos de un menor: el acudiente autoriza en su representación (Decreto 1377 de 2013, art. 12)
        if not datos.autoriza_tratamiento_datos:
            raise AutorizacionDatosRequerida()
        if actor.rol == Rol.ACUDIENTE:
            acudiente_id = actor.id
        elif actor.es_administrador:
            acudiente = self.usuarios.obtener_por_id(datos.acudiente_id) if datos.acudiente_id else None
            if acudiente is None or acudiente.rol != Rol.ACUDIENTE:
                raise AcudienteInvalido()
            acudiente_id = acudiente.id
        else:
            raise PermisoDenegado()

        estudiante = Estudiante(
            nombres=datos.nombres,
            apellidos=datos.apellidos,
            acudiente_id=acudiente_id,
            documento_identidad=datos.documento_identidad,
            fecha_nacimiento=datos.fecha_nacimiento,
            grado=datos.grado,
            fecha_autorizacion_datos=_ahora(),
        )
        return self.repository.guardar(estudiante)


class ListarEstudiantes:
    def __init__(self, repository: EstudianteRepository):
        self.repository = repository

    def execute(self, actor: Actor) -> list[Estudiante]:
        if actor.es_administrador:
            return self.repository.listar()
        if actor.rol == Rol.ACUDIENTE:
            return self.repository.listar(acudiente_id=actor.id)
        raise PermisoDenegado()


def _obtener_estudiante_gestionable(repository: EstudianteRepository, actor: Actor, estudiante_id: int):
    estudiante = repository.obtener_por_id(estudiante_id)
    if estudiante is None:
        raise EstudianteNoEncontrado(estudiante_id)
    if not estudiante.puede_ser_gestionado_por(actor):
        raise PermisoDenegado()
    return estudiante


class ActualizarEstudiante:
    CAMPOS = {"nombres", "apellidos", "documento_identidad", "fecha_nacimiento", "grado"}

    def __init__(self, repository: EstudianteRepository):
        self.repository = repository

    def execute(self, actor: Actor, estudiante_id: int, cambios: dict) -> Estudiante:
        if set(cambios) - self.CAMPOS:
            raise PermisoDenegado(f"No puede modificar: {', '.join(sorted(set(cambios) - self.CAMPOS))}.")
        estudiante = _obtener_estudiante_gestionable(self.repository, actor, estudiante_id)
        return self.repository.guardar(replace(estudiante, **cambios))


class CrearAccesoEstudiante:
    """RF-06: crea el usuario con el que el estudiante ingresa a ver el contenido de sus grupos."""

    def __init__(self, repository: EstudianteRepository, usuarios: UsuarioRepository):
        self.repository = repository
        self.usuarios = usuarios

    def execute(self, actor: Actor, estudiante_id: int, nombre_usuario: str, password: str) -> Estudiante:
        estudiante = _obtener_estudiante_gestionable(self.repository, actor, estudiante_id)
        if estudiante.usuario_id is not None:
            raise EstudianteYaTieneAcceso()
        datos = DatosUsuario(
            nombre_usuario=nombre_usuario,
            password=password,
            nombres=estudiante.nombres,
            apellidos=estudiante.apellidos,
        )
        usuario = _crear_usuario(self.usuarios, datos, Rol.ESTUDIANTE)
        estudiante.asignar_acceso(usuario.id)
        return self.repository.guardar(estudiante)


class RestablecerContrasenaEstudiante:
    """Los estudiantes no suelen tener correo: su acudiente les asigna una nueva contraseña."""

    def __init__(self, repository: EstudianteRepository, usuarios: UsuarioRepository):
        self.repository = repository
        self.usuarios = usuarios

    def execute(self, actor: Actor, estudiante_id: int, password: str) -> None:
        estudiante = _obtener_estudiante_gestionable(self.repository, actor, estudiante_id)
        if estudiante.usuario_id is None:
            raise EstudianteSinAcceso()
        self.usuarios.cambiar_password(estudiante.usuario_id, password)


# --- Supresión de datos (Ley 1581) ---


class AnonimizarUsuario:
    """
    Atiende una solicitud de supresión: borra los datos personales del usuario y,
    si es acudiente, los de sus estudiantes. Se conservan los registros (matrículas,
    publicaciones) sin datos que identifiquen a la persona.
    """

    def __init__(self, repository: UsuarioRepository, estudiantes: EstudianteRepository):
        self.repository = repository
        self.estudiantes = estudiantes

    def execute(self, usuario_id: int) -> Usuario:
        usuario = ObtenerUsuario(self.repository).execute(usuario_id)
        for estudiante in self.estudiantes.listar(acudiente_id=usuario_id):
            estudiante.anonimizar()
            self.estudiantes.guardar(estudiante)
            if estudiante.usuario_id is not None:
                self._anonimizar_cuenta(ObtenerUsuario(self.repository).execute(estudiante.usuario_id))
        return self._anonimizar_cuenta(usuario)

    def _anonimizar_cuenta(self, usuario: Usuario) -> Usuario:
        usuario.anonimizar()
        self.repository.inhabilitar_acceso(usuario.id)
        return self.repository.actualizar(usuario)
