from .base import *  # noqa: F401,F403
from .base import env_list, os

DEBUG = True

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-solo-para-desarrollo-local")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
