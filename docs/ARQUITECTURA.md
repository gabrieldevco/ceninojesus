# Decisiones de arquitectura

Estado de partida (28 de octubre de 2026): backend Django hexagonal por módulos (`domain`, `application`, `infrastructure`), PostgreSQL, JWT, Docker Compose con Caddy, y un frontend React con datos de demostración. Este documento fija hacia dónde vamos y por qué. Cada decisión se implementa en PR propios hacia `develop`.

## Principio rector

Escalar lo que ya duele o dolerá pronto, y no agregar piezas por moda. Es un colegio con tráfico bajo y picos en época de matrícula; la prioridad es **seguridad, confiabilidad y mantenibilidad**, no el volumen.

## Hallazgos del backend actual

| Hallazgo | Riesgo | Decisión |
|---|---|---|
| La caché y el límite de envíos usan la tabla de la base de datos (`DatabaseCache`) | Carga innecesaria en PostgreSQL; el límite no se comparte bien entre procesos | Redis |
| El servicio `workflow` es un ciclo de shell que corre un comando cada hora | Sin reintentos, sin trazabilidad, difícil de escalar | Celery + Celery Beat |
| Los correos se envían dentro del ciclo de la petición | Un SMTP lento o caído demora o rompe la respuesta | Tarea de Celery con reintentos |
| JWT sin rotación ni lista de revocación del refresh | Un refresh robado sirve hasta que expira | Rotación + blacklist |
| Sin cabeceras CSP/Permissions-Policy; sin límites de subida visibles | Superficie de ataque XSS y de archivos | Cabeceras en Caddy, validación de tipo y tamaño |
| Sin análisis de dependencias ni de secretos en CI | Vulnerabilidades silenciosas | Dependabot, `pip-audit`, `npm audit`, escaneo de secretos |

## Infraestructura

- **Redis** (un solo contenedor): caché, almacén del límite de envíos, y broker de Celery.
- **Celery + Beat**: envío de correos, recordatorios de interesados (RF-18), alertas de solicitudes de datos (Ley 1581) y notificaciones. Reemplaza el servicio `workflow`. Cada tarea es idempotente y con reintentos con espera exponencial.
- **Gunicorn** con varios workers detrás de Caddy, que ya sirve el frontend compilado con compresión y caché de estáticos.
- **Observabilidad mínima**: logs estructurados (JSON), `/api/salud/` ampliado con comprobación de base de datos y Redis, y Sentry (o equivalente) para errores.
- **Respaldos**: se mantienen (RNF-09) y se agrega una prueba periódica de restauración.

Se descartan por ahora: microservicios, Kubernetes, CDN propia y colas distintas de Redis. No aportan a esta escala y encarecen la operación.

## Seguridad

- Rotación del refresh token y blacklist al cerrar sesión; vida corta del access token.
- Bloqueo temporal por intentos fallidos de inicio de sesión (sobre Redis).
- Contraseñas con Argon2.
- Cabeceras en Caddy: CSP estricta, `Permissions-Policy`, `Referrer-Policy`, `X-Frame-Options`, HSTS con `includeSubDomains`.
- Subida de archivos: lista de tipos permitidos, tamaño máximo, nombre aleatorio y descarga solo por la API (ya existe el control de acceso por grupo).
- Datos personales y de menores: cifrado de copias de seguridad, registro de auditoría de accesos y anonimización ya existente, revisada contra la Ley 1581.
- CI: Dependabot, `pip-audit`, `npm audit`, escaneo de secretos y análisis estático (Ruff con reglas de seguridad `S`, CodeQL).

## Backend: SOLID y hexagonal

La estructura ya existe. Falta verificarla y hacerla cumplir:

- Auditoría módulo por módulo: que `domain` no importe Django ni DRF, que los casos de uso dependan de puertos y que las vistas solo traduzcan HTTP.
- `import-linter` en CI con contratos de dependencia entre capas.
- Ruff (formato y lint) y cobertura mínima exigida.

## Frontend: clean architecture

```
frontend/src/
├─ modules/<modulo>/{domain,application,infrastructure,presentation}
├─ shared/{http,ui}
└─ app/            # composition root (inyección de dependencias)
```

- **TypeScript estricto**.
- `HttpClient` propio sobre `fetch` detrás de una interfaz, con interceptor de autenticación y refresco compartido ante un 401.
- **TanStack Query** para estado del servidor; Zod valida las respuestas en el borde.
- Casos de uso puros, repositorios como puertos, DTO convertidos a entidades en `infrastructure`.
- Vitest, Testing Library y MSW. `eslint-plugin-boundaries` en CI para impedir que una capa interna importe de una externa.

## Orden de ejecución

| # | PR (rama) | Contenido |
|---|---|---|
| 1 | `fix/pantalla-blanca-app` | Corrección del error que dejaba la portada en blanco |
| 2 | `docs/decisiones-arquitectura` | Este documento |
| 3 | `chore/calidad-backend` | Ruff, import-linter, pip-audit, cobertura, Dependabot |
| 4 | `feature/redis-celery` | Redis, caché y límites en Redis, Celery/Beat, correos asíncronos |
| 5 | `feature/endurecer-seguridad` | Refresh con rotación, bloqueo por intentos, Argon2, cabeceras, subidas |
| 6 | `chore/frontend-typescript-capas` | TypeScript, estructura por capas, ESLint con límites, Vitest |
| 7 | `feature/frontend-auth` | `HttpClient`, módulo de autenticación real |
| 8 | `feature/frontend-<modulo>` | Matrícula, aula, solicitudes, admisiones, panel admin, Ley 1581 |
| 9 | `chore/observabilidad-y-despliegue` | Logs, salud ampliada, Sentry, prueba de restauración, producción |

Cada paso se prueba en local antes de abrir el PR.
