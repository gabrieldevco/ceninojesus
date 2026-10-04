import sys

from .base import *  # noqa: F401,F403
from .base import env_list, os

DEBUG = True

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY") or "django-insecure-solo-para-desarrollo-local"

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")

# Las pruebas no necesitan un hash de contraseñas seguro (y el seguro es lento)
if "test" in sys.argv:
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
