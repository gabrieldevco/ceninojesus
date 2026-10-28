# Guía de trabajo del equipo

Estas políticas aplican a todos los integrantes. Se hacen cumplir con GitHub (rulesets) y con los checks automáticos de `.github/workflows/`.

## Ramas

Solo existen dos ramas permanentes:

| Rama | Qué contiene | Cómo recibe código |
|---|---|---|
| `main` | Lo que está (o va a estar) en producción | **Solo** por PR desde `develop`, con 1 aprobación de otra persona |
| `develop` | Integración del trabajo en curso | **Solo** por PR desde una rama de trabajo, con 1 aprobación de otra persona |

Nadie sube directo a `main` ni a `develop`. Tampoco se permite `force push` ni borrarlas.

### Ramas de trabajo

Salen de `develop`, viven poco y se borran al fusionarse. El nombre es `<prefijo>/<descripcion-en-minusculas-con-guiones>`:

| Prefijo | Para qué | Ejemplo |
|---|---|---|
| `feature/` | Funcionalidad nueva | `feature/matricula-solicitud-api` |
| `fix/` | Corrección de un error | `fix/login-token-expirado` |
| `hotfix/` | Error urgente en producción (igual va por `develop`) | `hotfix/correo-recuperacion` |
| `docs/` | Solo documentación | `docs/guia-despliegue` |
| `refactor/` | Reorganizar código sin cambiar comportamiento | `refactor/repositorio-grupos` |
| `test/` | Agregar o mejorar pruebas | `test/interesados-workflow` |
| `chore/` | Mantenimiento, dependencias | `chore/actualizar-django` |
| `ci/` | Pipelines y automatización | `ci/cache-npm` |

## Pull requests

- Título con formato **Conventional Commits**: `tipo(alcance): descripción`. Ej.: `feat(grupos): aprobar o rechazar solicitudes`.
- El tipo debe corresponder al prefijo de la rama (`feature/` → `feat`, `fix/` y `hotfix/` → `fix`, `docs/` → `docs`, etc.).
- Se fusiona a `develop` con **squash** y a `main` con **merge commit**.
- Quien abre el PR no puede aprobarlo, y quien hizo el último push tampoco: la revisión la hace otra persona.
- Si se sube un cambio nuevo después de aprobar, la aprobación se descarta.
- Todas las conversaciones del PR deben estar resueltas antes de fusionar.

## Autoría de los commits

El código lo firman únicamente las personas del equipo. Los commits y PR **no** deben incluir líneas `Co-Authored-By` de herramientas de IA (por ejemplo Claude Code) ni textos como "Generated with Claude Code". El check `branch-policy` rechaza el PR si encuentra alguna.

## Checks obligatorios

Un PR solo se puede fusionar si pasan, y si la rama está actualizada con su destino:

| Check | Qué valida |
|---|---|
| `branch-policy` | Origen y destino permitidos, nombre de rama válido y commits sin coautor de IA |
| `pr-title` | Formato del título y coherencia con la rama |
| `backend-tests` | `makemigrations --check`, `manage.py check` y `manage.py test` |
| `frontend-build` | `npm ci` y `npm run build` |

Antes de abrir el PR, corre localmente lo mismo:

```bash
cd backend && python manage.py test
cd frontend && npm run build
```

## Reglas de seguridad

- Nunca subir `.env`, claves, tokens ni datos reales de estudiantes (Ley 1581 de 2012).
- Las credenciales del sistema actual del colegio no van en el repositorio.

## Flujo resumido

```bash
git checkout develop && git pull
git checkout -b feature/matricula-solicitud-api
# ...trabajar, commit...
git push -u origin feature/matricula-solicitud-api
# abrir PR hacia develop con título "feat(matriculas): ..."
```

## Para el administrador del repositorio

Las políticas están en `.github/rulesets/*.json`. Para aplicarlas:

```powershell
.\scripts\aplicar-politicas.ps1
```

O bien importar cada JSON en GitHub: *Settings → Rules → Rulesets → New ruleset → Import a ruleset*.

Pasos previos, una sola vez:

1. Crear la rama `develop` desde `main` y dejarla como rama por defecto.
2. Hacer que los workflows corran una vez (un PR de prueba) para que existan los checks requeridos.
3. Aplicar los rulesets.
