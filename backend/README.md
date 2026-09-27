# Backend — Django (arquitectura hexagonal)

API de la plataforma web del Centro Educativo El Niño Jesús.

**Stack:** Python 3.14 · Django 6.1 · Django REST Framework · SQLite en desarrollo.

## Puesta en marcha

Desde la carpeta `backend/`:

```bash
py -3.14 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

- API: http://127.0.0.1:8000/api/
- Admin: http://127.0.0.1:8000/admin/

Sin `POSTGRES_DB` en el `.env`, Django usa SQLite. Con esa variable, usa PostgreSQL. Puedes usar el contenedor `db`, que queda expuesto en `localhost:5432`.

### Con Docker

Desde la raíz del repositorio, con Docker Desktop abierto y `backend/.env` creado:

```bash
docker compose up -d --build
```

| Servicio | URL | Descripción |
|---|---|---|
| `backend` | http://localhost:8000 | Django con recarga automática (el código se monta como volumen) |
| `db` | `localhost:5432` | PostgreSQL 17 (volumen `postgres_data`) |
| `pgadmin` | http://localhost:5050 | pgAdmin, con el servidor "Ceniño Jesús (Docker)" ya registrado (volumen `pgadmin_data`) |

Las migraciones se aplican solas al arrancar el backend. Comandos útiles:

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py test
docker compose logs -f backend
docker compose down        # detiene los contenedores y conserva los datos
docker compose down -v     # detiene los contenedores y BORRA los volúmenes (base de datos incluida)
```

En producción, la imagen arranca por defecto con gunicorn y `config.settings.prod`, sin el `command` ni el volumen de código de `docker-compose.yml`.

Para ejecutar las pruebas:

```bash
python manage.py test
```

## Arquitectura hexagonal (puertos y adaptadores)

```
backend/
├── config/                  # Proyecto Django: settings (base/dev/prod), urls, wsgi/asgi
├── shared/                  # Núcleo compartido entre módulos
│   ├── domain/              #   Excepciones base del dominio
│   └── infrastructure/      #   Traducción de errores de dominio a HTTP
└── modules/
    └── <modulo>/
        ├── domain/          # Entidades, reglas de negocio, puertos (interfaces) — Python puro
        ├── application/     # Casos de uso — orquestan el dominio a través de los puertos
        ├── infrastructure/  # Adaptadores: Django app (models, admin, migrations),
        │   │                #   repositorios ORM y composición (dependencies.py)
        │   └── api/         #   Adaptador HTTP: serializers, views, urls (DRF)
        └── tests/
```

### Regla de dependencias

```
infrastructure  ──►  application  ──►  domain
```

- **`domain`** no importa nada de Django, DRF ni de otras capas.
- **`application`** solo conoce `domain` (entidades y puertos).
- **`infrastructure`** implementa los puertos y es la única capa que usa Django.
- Los casos de uso reciben sus dependencias (repositorios) por constructor. `dependencies.py` decide qué implementación concreta se usa.

Gracias a esto, el dominio y los casos de uso se prueban sin base de datos, con repositorios en memoria (ver `modules/interesados/tests/test_domain.py`).

### Módulo de referencia: `interesados`

Es el formulario de interesados (RF-16 a RF-19). Úsenlo como plantilla para los demás módulos.

| Método | Ruta | Permiso | Caso de uso |
|---|---|---|---|
| `POST` | `/api/interesados/` | Público | `RegistrarInteresado` |
| `GET` | `/api/interesados/?estado=nuevo` | Administrador | `ListarInteresados` |
| `PATCH` | `/api/interesados/<id>/estado/` | Administrador | `CambiarEstadoInteresado` |

### Cómo agregar un módulo nuevo

1. Copiar la estructura de `modules/interesados/` en `modules/<nuevo>/`.
2. Definir las entidades, las reglas y los puertos en `domain/`.
3. Escribir los casos de uso en `application/`.
4. En `infrastructure/`:
   - crear `apps.py` con `name = "modules.<nuevo>.infrastructure"` y un `label` corto;
   - crear los modelos, el repositorio y `dependencies.py`;
   - crear la API en `api/`.
5. Registrar la app en `LOCAL_APPS` (`config/settings/base.py`) y sus rutas en `config/urls.py`.
6. Crear las migraciones: `python manage.py makemigrations <label>`.

Módulos previstos: `institucional`, `usuarios` (roles y permisos), `grupos` (matrícula extracurricular), `contenidos` (LMS) e `interesados`.
