"""
Configuración común a todos los entornos.

Los valores sensibles o que cambian por entorno se leen de variables de
entorno (archivo `.env` en la raíz de `backend/`, ver `.env.example`).
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")


def env_list(name, default=""):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")

DEBUG = False

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS")


# Aplicaciones

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
]

# Cada módulo del dominio registra su adaptador de Django (modelos, admin,
# migraciones) desde su capa de infraestructura.
LOCAL_APPS = [
    "modules.usuarios.infrastructure.apps.UsuariosConfig",
    "modules.notificaciones.infrastructure.apps.NotificacionesConfig",
    "modules.institucional.infrastructure.apps.InstitucionalConfig",
    "modules.grupos.infrastructure.apps.GruposConfig",
    "modules.contenidos.infrastructure.apps.ContenidosConfig",
    "modules.interesados.infrastructure.apps.InteresadosConfig",
    "modules.datos_personales.infrastructure.apps.DatosPersonalesConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Base de datos: PostgreSQL si hay POSTGRES_DB (Docker), si no SQLite local

if os.getenv("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# Usuarios: modelo propio con tabla "usuarios" (ver modules/usuarios)

AUTH_USER_MODEL = "usuarios.Usuario"


# Contraseñas (RNF-03)

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internacionalización

LANGUAGE_CODE = "es-co"

TIME_ZONE = "America/Bogota"

USE_I18N = True

USE_TZ = True


# Archivos estáticos y multimedia

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Django REST Framework

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "EXCEPTION_HANDLER": "shared.infrastructure.exception_handler.domain_exception_handler",
    # Límite de envíos por IP en formularios públicos y autenticación (ver shared/infrastructure/throttling.py)
    "DEFAULT_THROTTLE_RATES": {
        "formularios": os.getenv("LIMITE_FORMULARIOS", "20/hour"),
        "autenticacion": os.getenv("LIMITE_AUTENTICACION", "10/minute"),
    },
    # Proxies delante de Django (Caddy en producción): necesario para identificar la IP real
    "NUM_PROXIES": int(os.getenv("NUM_PROXIES")) if os.getenv("NUM_PROXIES") else None,
}

# Redis: caché, límite de envíos y cola de Celery. Sin REDIS_URL (desarrollo local sin Docker)
# se usa la caché en base de datos y las tareas se ejecutan en el mismo proceso.
REDIS_URL = os.getenv("REDIS_URL", "")

if REDIS_URL:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}}
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.db.DatabaseCache", "LOCATION": "cache_aplicacion"}}

# Celery (tareas en segundo plano)
CELERY_BROKER_URL = REDIS_URL or "memory://"
CELERY_TASK_ALWAYS_EAGER = not REDIS_URL
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_TIME_LIMIT = 300
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULE = {
    "recordatorios-interesados": {
        "task": "interesados.enviar_recordatorios",
        "schedule": int(os.getenv("WORKFLOW_INTERVALO_SEGUNDOS", "3600")),
    },
    "alertas-solicitudes-datos": {
        "task": "datos_personales.alertar_por_vencer",
        "schedule": int(os.getenv("WORKFLOW_INTERVALO_SEGUNDOS", "3600")),
    },
}

# Autenticación JWT (RF-06): el frontend envía "Authorization: Bearer <access>"
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("JWT_ACCESS_MINUTOS", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("JWT_REFRESH_DIAS", "7"))),
    "USER_ID_CLAIM": "usuario_id",
}


# CORS (el frontend vive en otro origen)

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")


# Correo (notificaciones RF-08, RF-11, RF-18). En desarrollo se imprime en consola.

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "no-responder@ceninojesus.edu.co")


# Workflow de interesados (RF-18)

INTERESADOS_DIAS_SIN_RESPUESTA = int(os.getenv("INTERESADOS_DIAS_SIN_RESPUESTA", "3"))


# Recuperación de contraseña: el correo lleva un enlace al frontend
# (FRONTEND_URL/restablecer-contrasena?uid=...&token=...) válido por 2 horas

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
PASSWORD_RESET_TIMEOUT = 60 * 60 * 2
