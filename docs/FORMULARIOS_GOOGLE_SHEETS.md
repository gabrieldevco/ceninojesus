# Formularios del sitio en Google Sheets

Mientras el sitio funciona sin backend (`VITE_MODO_DEMO=true`), los formularios de **Admisiones** y de **Contacto** se guardan en una hoja de cálculo de Google de la institución. Cada respuesta nueva le llega por correo a `secretaria@ceninojesus.edu.co`.

Cuando se despliegue el backend (`docker-compose.prod.yml`), los formularios vuelven a usar la API y el panel de administración. Esta hoja deja de recibir datos, pero conserva lo que ya llegó.

## Cómo funciona

```
Formulario del sitio ──POST──▶ Apps Script (aplicación web) ──▶ Hoja "Admisiones" / "Contacto"
                                                             └──▶ Correo a secretaria@
```

- Código del script: [`apps-script/Formularios.gs`](apps-script/Formularios.gs).
- En el frontend: `VITE_FORMULARIOS_URL` (ver `frontend/.env.example`) y los repositorios `RepositorioInteresadosHoja` y `RepositorioInstitucionalHoja`.
- Si una persona no autoriza el tratamiento de datos (Ley 1581 de 2012), el script no guarda nada.
- Cada hoja tiene las columnas **Estado** (Nuevo, En seguimiento, Matriculado, Respondido, Descartado) y **Notas de seguimiento** para que la secretaría lleve el control.

## Instalación (una sola vez, con la cuenta `secretaria@ceninojesus.edu.co`)

1. Iniciar sesión en Google con `secretaria@ceninojesus.edu.co` y crear una hoja nueva en https://sheets.new. Nombre sugerido: **Formularios sitio web – El Niño Jesús**.
2. En la hoja: **Extensiones → Apps Script**.
3. Borrar el contenido de `Código.gs`, pegar el de `apps-script/Formularios.gs` y guardar.
4. Arriba, en la lista de funciones, elegir **`probar`** y darle **Ejecutar**.
   - Google pide permisos: **Revisar permisos**, elegir la cuenta de secretaría y luego **Configuración avanzada → Ir a … (no seguro) → Permitir**. El aviso aparece porque el script es propio y no está publicado en la tienda de Google.
   - Al terminar deben aparecer las pestañas **Admisiones** y **Contacto** con una fila de prueba, y dos correos de prueba en la bandeja de secretaría. Después se pueden borrar esas filas.
5. **Implementar → Nueva implementación**. En el engranaje, elegir **Aplicación web**:
   - Descripción: `Formularios sitio web`
   - Ejecutar como: **Yo (secretaria@ceninojesus.edu.co)**
   - Quién tiene acceso: **Cualquier persona**
6. **Implementar** y copiar la **URL de la aplicación web**, que termina en `/exec`. Esa URL se pone en `VITE_FORMULARIOS_URL` y se vuelve a compilar el sitio.

Si en el paso 5 no aparece la opción **Cualquier persona**, es probable que el administrador de Google Workspace del colegio tenga restringido compartir fuera del dominio. Hay que pedirle que lo permita para Apps Script, o crear la hoja con otra cuenta de Google y dejar el aviso por correo apuntando a secretaría.

## Publicar el sitio con la hoja conectada

```bash
cd frontend
VITE_MODO_DEMO=true VITE_FORMULARIOS_URL="https://script.google.com/macros/s/XXXX/exec" npm run build
```

En Vercel: *Settings → Environment Variables* → `VITE_FORMULARIOS_URL` y luego **Redeploy**.

## Si se cambia el script

En el editor de Apps Script: **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar**. Así se conserva la misma URL. Si se hace una implementación nueva, la URL cambia y hay que recompilar el sitio.

## Límites

- Gmail permite cerca de 1.500 correos diarios en cuentas de Workspace, de sobra para estos formularios.
- No hay captcha. Si llega spam, se puede agregar una pregunta de control o reCAPTCHA más adelante.
