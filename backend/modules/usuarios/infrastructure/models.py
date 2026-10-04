"""
Modelo de usuario propio (AUTH_USER_MODEL).

Reemplaza a `auth_user` para que la tabla y sus columnas estén en español.
Los atributos que Django exige por contrato (password, is_active, is_staff,
is_superuser, last_login, groups, user_permissions) conservan su nombre en
Python, pero se guardan en columnas y tablas con nombre en español.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, Group, Permission, PermissionsMixin
from django.db import models
from django.utils import timezone

from shared.domain.actor import Rol

ROLES = [
    (Rol.ADMINISTRADOR, "Administrador"),
    (Rol.ADMINISTRADOR_GRUPO, "Administrador de grupo"),
    (Rol.ACUDIENTE, "Padre / acudiente"),
    (Rol.ESTUDIANTE, "Estudiante"),
]


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _crear(self, nombre_usuario, correo, password, **extra):
        if not nombre_usuario:
            raise ValueError("El nombre de usuario es obligatorio.")
        usuario = self.model(nombre_usuario=nombre_usuario, correo=self.normalize_email(correo), **extra)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_user(self, nombre_usuario, correo=None, password=None, **extra):
        extra.setdefault("is_staff", False)
        extra.setdefault("is_superuser", False)
        return self._crear(nombre_usuario, correo, password, **extra)

    def create_superuser(self, nombre_usuario, correo=None, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("rol", Rol.ADMINISTRADOR)
        if not extra["is_staff"] or not extra["is_superuser"]:
            raise ValueError("Un superusuario debe tener is_staff e is_superuser en True.")
        return self._crear(nombre_usuario, correo, password, **extra)


class Usuario(AbstractBaseUser, PermissionsMixin):
    nombre_usuario = models.CharField("nombre de usuario", max_length=150, unique=True)
    correo = models.EmailField("correo electrónico", blank=True)
    nombres = models.CharField(max_length=150, blank=True)
    apellidos = models.CharField(max_length=150, blank=True)
    telefono = models.CharField("teléfono", max_length=20, blank=True)
    rol = models.CharField(max_length=30, choices=ROLES, default=Rol.ACUDIENTE)
    fecha_registro = models.DateTimeField("fecha de registro", default=timezone.now)
    fecha_autorizacion_datos = models.DateTimeField(
        "fecha de autorización de datos", null=True, blank=True, help_text="Prueba de la autorización (Ley 1581)."
    )

    # Campos heredados de Django, con columna en español
    password = models.CharField("contraseña", max_length=128, db_column="contrasena")
    last_login = models.DateTimeField("último ingreso", blank=True, null=True, db_column="ultimo_ingreso")
    is_active = models.BooleanField("activo", default=True, db_column="activo")
    is_staff = models.BooleanField(
        "acceso al administrador",
        default=False,
        db_column="es_personal",
        help_text="Permite ingresar al sitio de administración.",
    )
    is_superuser = models.BooleanField(
        "superusuario",
        default=False,
        db_column="es_superusuario",
        help_text="Tiene todos los permisos sin asignarlos explícitamente.",
    )
    groups = models.ManyToManyField(
        Group,
        verbose_name="grupos",
        blank=True,
        related_name="usuarios",
        related_query_name="usuario",
        db_table="usuarios_grupos",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name="permisos",
        blank=True,
        related_name="usuarios",
        related_query_name="usuario",
        db_table="usuarios_permisos",
    )

    objects = UsuarioManager()

    USERNAME_FIELD = "nombre_usuario"
    EMAIL_FIELD = "correo"
    REQUIRED_FIELDS = ["correo"]

    class Meta:
        db_table = "usuarios"
        verbose_name = "usuario"
        verbose_name_plural = "usuarios"

    def __str__(self):
        return self.nombre_usuario

    def get_full_name(self):
        return f"{self.nombres} {self.apellidos}".strip()

    def get_short_name(self):
        return self.nombres


class EstudianteModel(models.Model):
    nombres = models.CharField(max_length=150)
    apellidos = models.CharField(max_length=150)
    documento_identidad = models.CharField("documento de identidad", max_length=30, blank=True)
    fecha_nacimiento = models.DateField("fecha de nacimiento", null=True, blank=True)
    grado = models.CharField(max_length=30, blank=True)
    acudiente = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name="estudiantes_a_cargo")
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estudiante",
        help_text="Usuario con el que el estudiante ingresa a la plataforma.",
    )
    fecha_registro = models.DateTimeField("fecha de registro", default=timezone.now)
    fecha_autorizacion_datos = models.DateTimeField(
        "fecha de autorización de datos",
        null=True,
        blank=True,
        help_text="Autorización del acudiente en representación del menor (Ley 1581).",
    )

    class Meta:
        db_table = "estudiantes"
        verbose_name = "estudiante"
        verbose_name_plural = "estudiantes"
        ordering = ["apellidos", "nombres"]

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"
