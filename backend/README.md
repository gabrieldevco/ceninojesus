# Backend — Django (arquitectura hexagonal)

API de la plataforma web del Centro Educativo El Niño Jesús.

**Stack:** Python 3.14 · Django 6.1 · Django REST Framework · JWT (SimpleJWT) · PostgreSQL 17 (SQLite opcional en local).

## Puesta en marcha

Desde la carpeta `backend/`:

```bash
py -3.14 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createcachetable
python manage.py createsuperuser
python manage.py runserver
```

- API: http://127.0.0.1:8000/api/
- Admin: http://127.0.0.1:8000/admin/

Sin `REDIS_URL` las tareas de Celery se ejecutan en el mismo proceso y la caché usa la base de datos, por lo que en local no hace falta Redis.

Sin `POSTGRES_DB` en el `.env`, Django usa SQLite. Con esa variable, usa PostgreSQL. Puedes usar el contenedor `db`, que queda expuesto en `localhost:5434` (para no chocar con otros PostgreSQL de tu equipo).

### Con Docker

Desde la raíz del repositorio, con Docker Desktop abierto y `backend/.env` creado:

```bash
docker compose up -d --build
```

| Servicio | URL | Descripción |
|---|---|---|
| `backend` | http://localhost:8000 | Django con recarga automática (el código se monta como volumen) |
| `db` | `localhost:5434` | PostgreSQL 17 (volumen `postgres_data`) |
| `redis` | — | Caché, límite de envíos y cola de tareas (volumen `redis_data`) |
| `celery` | — | Ejecuta las tareas en segundo plano: envío de correos con reintentos, recordatorios y alertas |
| `celery-beat` | — | Programador: cada hora lanza los recordatorios de interesados (RF-18) y las alertas de solicitudes de datos por vencer |
| `backup` | `./backups` | Copia diaria de la base de datos y de los archivos subidos (RNF-09) |
| `pgadmin` | http://localhost:5050 | pgAdmin, con el servidor "Cenino Jesús (Docker)" ya registrado (volumen `pgadmin_data`) |

Las migraciones se aplican solas al arrancar el backend. Comandos útiles:

```bash
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py test
docker compose logs -f backend
docker compose down        # detiene los contenedores y conserva los datos
docker compose down -v     # detiene los contenedores y BORRA los volúmenes (base de datos incluida)
```

## Producción

`docker-compose.prod.yml` levanta el sistema completo en un servidor con Docker:

| Servicio | Descripción |
|---|---|
| `caddy` | Único servicio expuesto (puertos 80 y 443). Obtiene y renueva solo el certificado HTTPS (Let's Encrypt) para `DOMINIO`, sirve el frontend compilado (`frontend/dist`) y reenvía `/api`, `/admin` y `/static` al backend. |
| `backend` | Django con gunicorn y `config.settings.prod`. |
| `db` | PostgreSQL, sin puertos expuestos. |
| `redis`, `celery`, `celery-beat`, `backup` | Igual que en desarrollo. |

Los archivos que suben los administradores de grupo quedan en el volumen `media_data` y **solo** se descargan por la API, con control de acceso (RF-14). No hay una URL pública `/media/`.

Pasos en el servidor:

1. El dominio debe apuntar a la IP del servidor, con los puertos 80 y 443 abiertos.
2. Compilar el frontend para que exista `frontend/dist`.
3. Crear `backend/.env` a partir de `.env.example`:
   - `DJANGO_SECRET_KEY` nueva;
   - `DOMINIO`, `DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS=https://<dominio>` y `FRONTEND_URL=https://<dominio>`;
   - contraseñas propias en `POSTGRES_PASSWORD`;
   - datos SMTP reales en `EMAIL_*`.
4. Levantar:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Para probarlo en un equipo local, usa `DOMINIO=localhost`: Caddy crea un certificado local, y el navegador lo marcará como no confiable.

## Copias de seguridad (RNF-09)

El servicio `backup` guarda cada día en `./backups` un `db_<fecha>.dump` y un `archivos_<fecha>.tar.gz`, y borra los de más de `BACKUP_DIAS_RETENCION` días (14). **Conviene copiar esa carpeta periódicamente fuera del servidor** (disco externo o nube): una copia en la misma máquina no protege si se daña el disco.

Restaurar una copia:

```bash
# En una base aparte, para revisarla sin tocar la principal:
docker compose exec backup sh /scripts/restaurar.sh db_20261004_032625.dump prueba_restauracion

# Sobre la base principal (REEMPLAZA sus datos):
docker compose exec backup sh /scripts/restaurar.sh db_20261004_032625.dump
```

Desde Git Bash, antepón `MSYS_NO_PATHCONV=1` a estos comandos; desde PowerShell no hace falta. En producción, agrega `-f docker-compose.prod.yml` después de `docker compose`. Los archivos subidos se restauran descomprimiendo el `.tar.gz` en el volumen `media_data`.

Para ejecutar las pruebas:

```bash
python manage.py test
```

## Arquitectura hexagonal (puertos y adaptadores)

```
backend/
├── config/                  # Proyecto Django: settings (base/dev/prod), urls, wsgi/asgi
├── shared/                  # Núcleo compartido entre módulos
│   ├── domain/              #   Excepciones base, roles y Actor, puerto Notificador
│   └── infrastructure/      #   Permisos por rol y traducción de errores de dominio a HTTP
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

### Convención: base de datos en español

- Toda tabla propia define `db_table` en español y en plural (`interesados`, `usuarios`).
- Los campos se nombran en español (`correo`, `fecha_registro`). Si Django exige un atributo en inglés (por ejemplo `is_staff` o `password`), se le asigna `db_column` en español.
- El usuario es un modelo propio (`modules/usuarios`, `AUTH_USER_MODEL = "usuarios.Usuario"`) con la tabla `usuarios`. Nunca uses `auth.User`; usa `get_user_model()` o `settings.AUTH_USER_MODEL`.
- Las tablas internas del framework (`auth_group`, `auth_permission`, `django_session`, `django_admin_log`, `django_content_type` y `django_migrations`) conservan su nombre, porque Django las gestiona.

### Comunicación entre módulos

Un módulo nunca importa el dominio de otro. Cuando necesita algo de otro módulo, define un **puerto** en su propio `domain/ports.py` y lo implementa con un adaptador en su `infrastructure/`. Por ejemplo:
- `grupos` define `DirectorioUsuarios` para consultar estudiantes, y lo implementa `grupos/infrastructure/directorio.py`.
- `contenidos` define `AccesoGrupos` para saber quién puede ver un grupo, y lo implementa `contenidos/infrastructure/acceso.py`.
- Todos los módulos usan el puerto compartido `shared/domain/notificaciones.py`, implementado por `notificaciones/infrastructure/notificador.py`.

## Módulos y tablas

| Módulo | Requisitos | Tablas |
|---|---|---|
| `usuarios` | RF-06, RF-20 | `usuarios`, `usuarios_grupos`, `usuarios_permisos`, `estudiantes` |
| `institucional` | RF-01 a RF-05 | `informacion_institucional`, `enlaces_portal`, `mensajes_contacto` |
| `grupos` | RF-07 a RF-11 | `grupos_extracurriculares`, `grupos_administradores`, `solicitudes_matricula` |
| `contenidos` | RF-12 a RF-15 | `materiales_apoyo`, `actividades` |
| `interesados` | RF-16 a RF-19 | `interesados`, `seguimientos_interesados`, `recordatorios_interesados` |
| `notificaciones` | RF-08, RF-11, RF-18 | `notificaciones` |
| `datos_personales` | RNF-10 (Ley 1581) | `solicitudes_datos_personales` |

Las migraciones crean datos iniciales: la información pública del colegio y los grupos de Ajedrez y Robótica.

### Roles

| Rol | Puede |
|---|---|
| `administrador` | Todo: usuarios y roles, sitio institucional, grupos, interesados. El superusuario siempre cuenta como administrador. |
| `administrador_grupo` | Gestionar los grupos que se le asignen: aprobar o rechazar matrículas y publicar material y actividades. |
| `acudiente` | Registrarse, registrar a sus hijos, crearles acceso, solicitar matrículas y ver sus respuestas. |
| `estudiante` | Ver el material y las actividades publicadas de los grupos en los que fue aprobado. |

## API

**Autenticación:** el frontend obtiene los tokens con `POST /api/auth/token/` (`nombre_usuario`, `password`) y envía `Authorization: Bearer <access>` en cada petición. El token `access` dura 60 minutos; para renovarlo se usa `POST /api/auth/token/refresh/` con el `refresh`. Sin token, la API responde `401`; con un rol sin permiso, `403`.

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/token/` | Público | Inicio de sesión (JWT) |
| `POST` | `/api/auth/token/refresh/` | Público | Renovar el token |
| `POST` | `/api/auth/registro/` | Público | Registro de padres/acudientes (exige `autoriza_tratamiento_datos`) |
| `POST` | `/api/auth/recuperar/` | Público | Envía un enlace para restablecer la contraseña (`identificador`: usuario o correo) |
| `POST` | `/api/auth/recuperar/confirmar/` | Público | Nueva contraseña con el `uid` y el `token` del enlace |
| `GET` `PATCH` | `/api/auth/perfil/` | Autenticado | Ver y editar el perfil propio |
| `POST` | `/api/auth/perfil/contrasena/` | Autenticado | Cambiar la contraseña (`password_actual`, `password_nueva`) |
| `GET` | `/api/auth/mis-datos/` | Autenticado | Todos los datos personales que guarda el sistema del usuario (Ley 1581) |
| `GET` `POST` | `/api/usuarios/?rol=` | Administrador | Listar y crear usuarios con cualquier rol (RF-20) |
| `GET` `PATCH` | `/api/usuarios/<id>/` | Administrador | Cambiar datos, rol o `activo` |
| `POST` | `/api/usuarios/<id>/anonimizar/` | Administrador | Supresión de datos del usuario y de sus estudiantes (Ley 1581) |
| `GET` `POST` | `/api/estudiantes/` | Acudiente, administrador | Hijos del acudiente (el administrador ve todos) |
| `PATCH` | `/api/estudiantes/<id>/` | Acudiente dueño, administrador | Editar un estudiante |
| `POST` | `/api/estudiantes/<id>/acceso/` | Acudiente dueño, administrador | Crear el usuario con el que entra el estudiante |
| `POST` | `/api/estudiantes/<id>/acceso/contrasena/` | Acudiente dueño, administrador | Nueva contraseña del estudiante (los menores no suelen tener correo) |
| `GET` `PATCH` | `/api/institucional/` | Público / administrador | Historia, misión, visión, contacto, ubicación, Facebook, política de datos |
| `GET` | `/api/institucional/politica-datos/` | Público | Política de tratamiento de datos, para enlazarla en los formularios |
| `GET` `POST` | `/api/institucional/enlaces/` | Público / administrador | Enlaces al sistema administrativo y a la biblioteca. Los que tienen `requiere_autenticacion` solo se muestran con sesión iniciada |
| `PATCH` `DELETE` | `/api/institucional/enlaces/<id>/` | Administrador | |
| `POST` `GET` | `/api/institucional/contacto/` | Público / administrador | Formulario de contacto (RF-03) |
| `POST` | `/api/institucional/contacto/<id>/leido/` | Administrador | Marcar un mensaje como leído |
| `GET` `POST` | `/api/grupos/` | Público / administrador | Grupos activos; crear un grupo |
| `GET` `PATCH` | `/api/grupos/<id>/` | Público / administrador del grupo | |
| `PUT` | `/api/grupos/<id>/administradores/` | Administrador | Asignar los administradores del grupo |
| `GET` | `/api/grupos/mis-grupos/` | Autenticado | Grupos que administra, en los que está inscrito o en los que están sus hijos |
| `GET` | `/api/grupos/<id>/inscritos/` | Administrador del grupo | Estudiantes aprobados |
| `GET` `POST` | `/api/matriculas/?estado=&grupo=` | Según el rol / acudiente | Solicitudes de matrícula (RF-07, RF-10) |
| `POST` | `/api/matriculas/<id>/aprobar/` | Administrador del grupo | Aprobar (RF-09); se notifica al acudiente (RF-11) |
| `POST` | `/api/matriculas/<id>/rechazar/` | Administrador del grupo | Rechazar con `motivo` (RF-09, RF-11) |
| `GET` `POST` | `/api/grupos/<id>/materiales/` | Inscritos / administrador del grupo | Material de apoyo (RF-12, RF-15). `POST` en `multipart/form-data` con `archivo` o `url` |
| `GET` `PATCH` `DELETE` | `/api/grupos/<id>/materiales/<id>/` | Inscritos / administrador del grupo | |
| `GET` | `/api/grupos/<id>/materiales/<id>/archivo/` | Inscritos / administrador del grupo | Descarga protegida (RF-14) |
| | `/api/grupos/<id>/actividades/...` | Igual que materiales | Actividades (RF-13), con `fecha_entrega` |
| `POST` `GET` | `/api/interesados/?estado=` | Público / administrador | Formulario de interesados (RF-16, RF-17) |
| `PATCH` | `/api/interesados/<id>/estado/` | Administrador | Cambiar el estado (RF-19) |
| `GET` `POST` | `/api/interesados/<id>/seguimientos/` | Administrador | Registrar contactos con el interesado |
| `POST` | `/api/interesados/<id>/anonimizar/` | Administrador | Supresión de los datos del interesado (Ley 1581) |
| `POST` `GET` | `/api/datos-personales/solicitudes/?estado=` | Público / administrador | Solicitudes de consulta, actualización, rectificación, supresión o revocatoria |
| `POST` | `/api/datos-personales/solicitudes/<id>/tramitar/` | Administrador | Marcar como en trámite |
| `POST` | `/api/datos-personales/solicitudes/<id>/responder/` | Administrador | Responder; la respuesta se envía al titular por correo |
| `GET` | `/api/notificaciones/?no_leidas=1` | Autenticado | Notificaciones propias |
| `POST` | `/api/notificaciones/<id>/leer/` | Autenticado | Marcar una notificación como leída |
| `GET` | `/api/salud/` | Público | Chequeo de salud (lo usa Docker) |

**Límite de envíos:** los formularios públicos (contacto, interesados, registro y solicitudes de datos) aceptan 20 envíos por hora por IP, y el inicio de sesión y la recuperación de contraseña, 10 por minuto. Al superarlo, la API responde `429`. Se ajusta con `LIMITE_FORMULARIOS` y `LIMITE_AUTENTICACION`.

**Recuperación de contraseña:** el correo enlaza a `FRONTEND_URL/restablecer-contrasena?uid=...&token=...`. El frontend debe tener esa página, que envía `uid`, `token` y la nueva `password` a `/api/auth/recuperar/confirmar/`. El enlace vale 2 horas y sirve una sola vez.

### Protección de datos personales (Ley 1581 de 2012, RNF-10)

- **Autorización:** el registro de acudientes, el de estudiantes (el acudiente autoriza en nombre del menor), el formulario de interesados y el de contacto exigen `autoriza_tratamiento_datos: true`. La fecha de la autorización queda guardada como prueba. El frontend debe mostrar junto a la casilla un enlace a la política (`/api/institucional/politica-datos/`).
- **Política:** las migraciones cargan un **borrador** que el colegio debe revisar, completar (canal de atención, fecha de vigencia) y aprobar antes de publicar. Se edita desde el admin, en "Información institucional".
- **Derechos del titular:**
  - **Consulta:** `/api/auth/mis-datos/`.
  - **Rectificación:** edición del perfil y de los estudiantes.
  - **Cualquier titular**, tenga cuenta o no, puede radicar una solicitud en `/api/datos-personales/solicitudes/`. Recibe un acuse con su número de radicado y la fecha límite: 10 días hábiles para consultas y 15 para reclamos. El cálculo no descuenta festivos.
  - **Supresión:** el administrador la atiende con los endpoints `anonimizar`. Estos borran los datos personales y conservan el historial sin identificar a nadie.
- **Alertas:** Celery Beat avisa a los administradores, una vez al día, de las solicitudes a 3 días o menos de vencer.

### Workflow de recordatorios (RF-18)

El comando `python manage.py enviar_recordatorios_interesados` avisa a los administradores, en la aplicación y por correo, de los interesados en estado `nuevo` o `en_seguimiento` que llevan `INTERESADOS_DIAS_SIN_RESPUESTA` días (3 por defecto) sin respuesta. No repite el aviso dentro del mismo plazo. Registrar un seguimiento reinicia el plazo. En Docker lo programa Celery Beat cada hora (tarea `interesados.enviar_recordatorios`); el comando sigue disponible para ejecutarlo a mano.

En desarrollo, los correos se imprimen en la consola: `docker compose logs -f backend`.

### Cómo agregar un módulo nuevo

1. Copiar la estructura de `modules/interesados/` (la plantilla más sencilla) en `modules/<nuevo>/`.
2. Definir las entidades, las reglas y los puertos en `domain/`.
3. Escribir los casos de uso en `application/`.
4. En `infrastructure/`:
   - crear `apps.py` con `name = "modules.<nuevo>.infrastructure"` y un `label` corto;
   - crear los modelos, el repositorio y `dependencies.py`;
   - crear la API en `api/`.
5. Registrar la app en `LOCAL_APPS` (`config/settings/base.py`) y sus rutas en `config/urls.py`.
6. Crear las migraciones: `python manage.py makemigrations <label>`.
