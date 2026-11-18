/**
 * Envía un formulario público a una hoja de cálculo de Google (Apps Script publicado como aplicación web).
 *
 * Se usa mientras el sitio funciona sin backend: las respuestas quedan en una hoja de la institución y el script
 * avisa por correo. Apps Script no responde a las peticiones de verificación CORS, por eso se envía como texto
 * plano en modo `no-cors`: la respuesta no se puede leer, pero si la red falla `fetch` lanza un error.
 */
export type TipoDeFormulario = 'admisiones' | 'contacto'

export async function enviarAHojaDeCalculo(
  url: string,
  formulario: TipoDeFormulario,
  datos: Record<string, string | boolean>,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): Promise<void> {
  await fetchImpl(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ formulario, ...datos, pagina: typeof location === 'undefined' ? '' : location.href }),
  })
}
