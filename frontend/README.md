# Centro Educativo El Niño Jesús · Frontend (prototipo)

Prototipo navegable basado en el Figma `prototipoFrontEnd`. React + Vite + React Router + Framer Motion.

## Ejecutar
```
npm install
npm run dev
```

## Cuentas de demostración (clave: `demo1234`)
| Rol | Correo | Redirige a |
|---|---|---|
| Padre / acudiente | padre@demo.com | /familias/matricula |
| Estudiante | estudiante@demo.com | /estudiante/aula |
| Admin de grupo (Robótica) | admin@demo.com | /admin/solicitudes |

## Pantallas
`/` Inicio · `/acceso` Portal de acceso · `/admisiones` Interesados · `/familias/matricula` · `/estudiante/aula` · `/admin/solicitudes`

El estado (solicitudes, sesión) vive en localStorage: lo que el padre solicita lo ve el admin, y lo que el admin aprueba habilita el aula. Se reemplaza por la API Django al conectar el backend (`src/store.jsx`).

Paleta: azul #004aad, coral #f04a34, texto #202d42 (tokens en `src/styles.css`).

## Enlaces externos
Definidos en `src/data/links.js`: aula virtual (Control Academic) y correo institucional (Gmail). Se abren en pestaña nueva desde la barra, el portal de acceso, el pie de página y el menú lateral del portal.
