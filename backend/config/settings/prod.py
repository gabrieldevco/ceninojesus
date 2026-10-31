from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import ALLOWED_HOSTS, REST_FRAMEWORK, SECRET_KEY, env_list, os

if not SECRET_KEY:
    raise ImproperlyConfigured("Falta la variable de entorno DJANGO_SECRET_KEY.")

DEBUG = False

# El chequeo de salud de Docker llama a http://localhost:8000/api/salud/ desde el propio contenedor
ALLOWED_HOSTS = [*ALLOWED_HOSTS, "localhost"]

# Caddy termina HTTPS y reenvía la petición indicando el protocolo original
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_REDIRECT_EXEMPT = [r"^api/salud/$"]
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# Necesario para el admin de Django sobre HTTPS, p. ej. https://ceninojesus.edu.co
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")

# Un proxy (Caddy) delante: el límite de envíos usa la IP real del visitante
REST_FRAMEWORK = {**REST_FRAMEWORK, "NUM_PROXIES": int(os.getenv("NUM_PROXIES", "1"))}
