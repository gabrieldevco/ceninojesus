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
