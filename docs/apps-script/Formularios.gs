/**
 * Recibe los formularios públicos del sitio (admisiones y contacto), los guarda en esta hoja de cálculo
 * y avisa por correo a la secretaría. Se publica como "Aplicación web" (ver docs/FORMULARIOS_GOOGLE_SHEETS.md).
 */
const CORREO_AVISOS = 'secretaria@ceninojesus.edu.co';
const SITIO = 'Centro Educativo El Niño Jesús';

const HOJAS = {
  admisiones: {
    nombre: 'Admisiones',
    columnas: ['Fecha', 'Acudiente', 'Teléfono', 'Correo', 'Aspirante', 'Grado de interés', 'Mensaje', 'Autoriza datos', 'Estado', 'Notas de seguimiento'],
    fila: (d) => [d.acudiente, d.telefono, d.correo, d.aspirante, d.grado, d.mensaje],
    asunto: (d) => `Nueva solicitud de admisión: ${d.acudiente} (${d.grado})`,
  },
  contacto: {
    nombre: 'Contacto',
    columnas: ['Fecha', 'Nombre', 'Teléfono', 'Correo', 'Asunto', 'Mensaje', 'Autoriza datos', 'Estado', 'Notas de seguimiento'],
    fila: (d) => [d.nombre, d.telefono, d.correo, d.asunto, d.mensaje],
    asunto: (d) => `Nuevo mensaje de contacto: ${d.asunto || d.nombre}`,
  },
};

function doPost(e) {
  const candado = LockService.getScriptLock();
  candado.waitLock(10000);
  try {
    const datos = JSON.parse(e.postData.contents);
    const config = HOJAS[datos.formulario];
    if (!config) return respuesta({ ok: false, error: 'formulario desconocido' });
    // Ley 1581 de 2012: sin autorización no se guardan datos personales
    if (datos.autorizaDatos !== true) return respuesta({ ok: false, error: 'sin autorización de datos' });

    const limpio = {};
    Object.keys(datos).forEach((clave) => (limpio[clave] = limpiar(datos[clave])));

    const hoja = obtenerHoja(config);
    hoja.appendRow([new Date(), ...config.fila(limpio).map(protegerCelda), 'Sí', 'Nuevo', '']);

    avisarPorCorreo(config, limpio, hoja);
    return respuesta({ ok: true });
  } catch (error) {
    console.error(error);
    return respuesta({ ok: false, error: String(error) });
  } finally {
    candado.releaseLock();
  }
}

function obtenerHoja(config) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(config.nombre);
  if (!hoja) {
    hoja = libro.insertSheet(config.nombre);
    hoja.appendRow(config.columnas);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, config.columnas.length).setFontWeight('bold').setBackground('#0b4aa2').setFontColor('#ffffff');
    const estado = config.columnas.indexOf('Estado') + 1;
    const regla = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Nuevo', 'En seguimiento', 'Matriculado', 'Respondido', 'Descartado'], true)
      .build();
    hoja.getRange(2, estado, 1000, 1).setDataValidation(regla);
  }
  return hoja;
}

function avisarPorCorreo(config, d, hoja) {
  const campos = config.columnas.slice(1, 1 + config.fila(d).length);
  const cuerpo = campos.map((campo, i) => `${campo}: ${config.fila(d)[i] || '—'}`).join('\n');
  const opciones = { name: `Sitio web — ${SITIO}` };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) opciones.replyTo = d.correo;
  MailApp.sendEmail(
    CORREO_AVISOS,
    config.asunto(d),
    `${cuerpo}\n\nVer todas las respuestas: ${hoja.getParent().getUrl()}#gid=${hoja.getSheetId()}\n` +
      'Responder a este correo le escribe directamente a la persona.',
    opciones,
  );
}

/** Recorta y normaliza lo que llega del formulario. */
function limpiar(valor) {
  if (typeof valor === 'boolean') return valor;
  return String(valor == null ? '' : valor).trim().slice(0, 2000);
}

/** Evita que un texto que empiece por =, +, - o @ se interprete como fórmula en la hoja. */
function protegerCelda(valor) {
  return typeof valor === 'string' && /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
}

function respuesta(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutar una vez desde el editor: pide los permisos y deja una fila de prueba en cada hoja. */
function probar() {
  const base = { autorizaDatos: true, telefono: '3000000000', correo: CORREO_AVISOS, mensaje: 'Prueba de instalación' };
  doPost({ postData: { contents: JSON.stringify({ ...base, formulario: 'admisiones', acudiente: 'Prueba', aspirante: '', grado: 'Primaria' }) } });
  doPost({ postData: { contents: JSON.stringify({ ...base, formulario: 'contacto', nombre: 'Prueba', asunto: 'Prueba' }) } });
}
