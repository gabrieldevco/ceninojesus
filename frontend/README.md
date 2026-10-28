# Centro Educativo El Niño Jesús · Frontend

Prototipo navegable basado en el Figma `prototipoFrontEnd`. React 18 + TypeScript estricto + Vite + React Router + TanStack Query + Framer Motion.

## Ejecutar
```
npm install
npm run dev          # servidor de desarrollo
npm run lint         # ESLint + reglas de arquitectura
npm test             # Vitest
npm run build        # tipos + compilación
```

## Arquitectura (clean architecture por módulo)

```
src/
├─ modules/<modulo>/        auth, grupos, estudiantes, matriculas, aula, interesados, institucional
│  ├─ domain/               entidades, reglas puras y puertos (interfaces)
│  ├─ application/          casos de uso
│  ├─ infrastructure/       adaptadores de los puertos (hoy: demostración en localStorage)
│  ├─ presentation/         páginas, componentes y hooks (TanStack Query)
│  └─ index.ts              API pública del módulo
├─ shared/                  UI genérica, configuración, utilidades, almacenamiento
└─ app/                     rutas, layouts y composición de dependencias (Proveedores.tsx)
```

Las dependencias apuntan hacia adentro (`presentation → application → domain`, `infrastructure → application → domain`) y un módulo solo usa a otro por su `index.ts`. ESLint (`eslint-plugin-boundaries`) rompe el build si se viola. Para conectar la API se escribe un repositorio HTTP que implemente el puerto del módulo y se cambia en `app/Proveedores.tsx`.

## Conexión con la API
Por defecto el frontend habla con el backend de Django: en desarrollo Vite reenvía `/api` a http://localhost:8000 (levantar el backend primero) y en producción lo hace Caddy. Hoy están conectados el **formulario público de admisiones** (con la autorización de datos del interesado) y su **gestión por el administrador general** en `/admin/interesados` (listado por estado, seguimientos y cambio de estado), el **inicio de sesión** (JWT con renovación automática y cierre de sesión que revoca el token), el **registro público de acudientes** (`/registro`) y la **recuperación de contraseña** por correo (`/restablecer-contrasena`, con enlace de un solo uso), los **grupos**, el **registro de estudiantes** por el acudiente (con la autorización de datos de la Ley 1581), que también les **crea el acceso** con el que cada estudiante entra al aula y les cambia la contraseña y las **matrículas** (solicitud del acudiente, aprobación o rechazo del administrador de grupo). El **aula** del estudiante muestra el material y las actividades reales del grupo (los archivos se descargan con la sesión del usuario, no con un enlace público). El **administrador de grupo** publica material y actividades (con archivo, enlace o ambos; como borrador o publicados) y las elimina desde `/admin/contenido`. El **administrador general** gestiona desde `/admin/usuarios` (RF-20) las cuentas (crear, cambiar rol, activar o desactivar, anonimizar por la Ley 1581) y los grupos (crear, editar, activar y asignar quién los administra); no puede quitarse su propio acceso.

Para trabajar sin backend, crear `.env.local` con `VITE_MODO_DEMO=true` (ver `.env.example`).

## Cuentas de demostración (solo con `VITE_MODO_DEMO=true`, clave: `demo1234`)
| Rol | Usuario | Redirige a |
|---|---|---|
| Padre / acudiente | padre | /familias/matricula |
| Estudiante | estudiante | /estudiante/aula |
| Admin de grupo (Robótica) | admin | /admin/solicitudes |
| Administrador general | general | /admin/solicitudes |

## Pantallas
`/` Inicio · `/acceso` Portal de acceso · `/admisiones` Interesados · `/familias/estudiantes` · `/familias/matricula` · `/estudiante/aula` · `/admin/solicitudes` · `/admin/contenido`

El estado (solicitudes, sesión) vive en localStorage: lo que el padre solicita lo ve el admin, y lo que el admin aprueba habilita el aula. Esos repositorios de demostración se reemplazan por la API Django al conectar el backend.

Paleta: azul #004aad, coral #f04a34, texto #202d42 (tokens en `src/app/styles.css`).

## Enlaces externos
Definidos en `src/shared/config/links.ts`: aula virtual (Control Academic) y correo institucional (Gmail). Se abren en pestaña nueva desde la barra, el portal de acceso, el pie de página y el menú lateral del portal.
