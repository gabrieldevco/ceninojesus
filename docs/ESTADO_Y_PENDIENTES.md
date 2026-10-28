# Estado del proyecto y pendientes

Corte: 28 de octubre de 2026. Basado en el Documento de Requerimientos (Fase 1), el README y el código de `main`. El avance del backend se estimó por estructura y pruebas; no se ejecutó la suite completa para este corte.

## Qué hay

**Backend (Django + DRF, arquitectura hexagonal, en `backend/modules/`)**

| Módulo | Cubre | Pruebas |
|---|---|---|
| `institucional` | RF-01, RF-02, RF-03 | sí |
| `usuarios` | RF-06, RF-20, RNF-03 (JWT, roles, recuperación de contraseña) | sí |
| `grupos` | RF-07, RF-09, RF-10 (grupos y matrículas) | sí |
| `contenidos` | RF-12 a RF-15 (material y actividades con acceso restringido) | sí |
| `interesados` | RF-16 a RF-19 (formulario, estados, recordatorios) | sí |
| `notificaciones` | RF-08, RF-11 | sí |
| `datos_personales` | RNF-10 (Ley 1581, solicitudes de habeas data) | sí |

Infraestructura: Docker Compose de desarrollo y producción (Caddy + HTTPS), servicio `workflow`, copias de seguridad diarias (RNF-09), límite de envíos por IP.

**Frontend (React + Vite)**: sitio institucional, acceso, admisiones, matrícula del padre, aula del estudiante y solicitudes del administrador. Funciona con **datos de demostración en `localStorage`**; todavía no habla con la API.

## Qué falta

### 1. Integración frontend ↔ backend (lo más grande)
- Cliente HTTP, manejo de JWT (login, refresh, logout) y recuperación de contraseña, reemplazando `store.jsx` y `data/demo.js`.
- Conectar cada pantalla a su endpoint: matrícula, aula (material/actividades), solicitudes, admisiones (interesados), contacto.
- Pantallas que no existen: solicitudes de datos personales (el panel de administración general, RF-20, ya existe en `/admin/usuarios`).
- Rutas de `Guard` por los 5 roles reales del sistema (hoy solo 3 de demostración).

### 2. Calidad y profesionalización
- Políticas de ramas y CI (este cambio). Falta aplicar los rulesets en GitHub.
- Lint y formato (Ruff en backend, ESLint en frontend) y pruebas del frontend.
- Cobertura mínima exigida en CI y revisión de dependencias.
- Unificar ramas viejas (`backend`, `frontend`, `Desarollo-pruebas-Felipe`) hacia `develop` y retirarlas.

### 3. Contenido y diseño
- Textos reales de historia, misión y visión (hoy dicen "Propuesta"), validados por rectoría.
- Mockups aprobados (actividad 2 del plan) y fotos definitivas.
- Pruebas en Chrome, Firefox, Edge y Safari (RNF-07), rendimiento < 3 s (RNF-04) y revisión responsive (RNF-01).

### 4. Salida a producción (actividad 7)
- **Dominio y página actual del colegio.** Según el audio reenviado, el colegio ya tiene una página y paga el dominio; el ingeniero que la manejaba ya no trabaja ahí. Hay que pedir al director, vía Gabriel, quién administra el dominio (DNS/hosting) y qué credenciales o accesos se pueden delegar. No se guardan en el repo.
- Definir con el colegio si la plataforma reemplaza la página actual o convive con ella, y cómo se enlaza el aula virtual (`controlacademic.co`).
- Servidor, SMTP real para correos, variables de producción, prueba de restauración de copia de seguridad.
- Capacitación y acta de entrega.

## Orden propuesto

1. Aplicar políticas y CI; crear `develop`.
2. Cliente API + autenticación real en el frontend.
3. Flujo de matrícula de extremo a extremo (padre → admin de grupo → notificación).
4. Aula del estudiante con contenido real.
5. Admisiones e interesados + panel del administrador.
6. Ley 1581 en el frontend (consentimiento, solicitudes).
7. Pruebas, lint, contenido real.
8. Despliegue, capacitación y entrega.
