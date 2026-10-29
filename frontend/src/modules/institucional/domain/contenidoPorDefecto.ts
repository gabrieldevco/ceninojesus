import type { ContenidoLanding, ElementoLanding, SeccionLanding } from './landing'

/**
 * Contenido con el que se publicó la página. Se muestra mientras carga el del servidor, si este no responde
 * y en el modo demostración; el servidor trae el mismo punto de partida y la institución lo edita desde el panel.
 */
const el = (
  id: number,
  seccion: SeccionLanding,
  orden: number,
  titulo: string,
  texto: string,
  extra: Partial<Pick<ElementoLanding, 'detalle' | 'icono' | 'imagen'>> = {},
): ElementoLanding => ({
  id,
  seccion,
  orden,
  titulo,
  texto,
  detalle: extra.detalle ?? '',
  icono: extra.icono ?? '',
  imagen: extra.imagen ?? '',
  tieneImagenSubida: false,
  activo: true,
})

export const CONTENIDO_POR_DEFECTO: ContenidoLanding = {
  informacion: {
    nombre: 'Centro Educativo El Niño Jesús',
    historia:
      'Nuestra historia se construye en los vínculos entre estudiantes, docentes y familias, y en las experiencias compartidas de aprendizaje.',
    mision:
      'Acompañar la formación integral de personas críticas y autónomas, que construyan conocimiento, vivan sus valores y contribuyan al cuidado del medio ambiente.',
    vision:
      'Una comunidad de aprendizaje que impulse el liderazgo, la investigación, el arte y la participación responsable de sus estudiantes.',
    direccion: 'Calle 38B # 4-35',
    ciudad: 'Barranquilla - Colombia',
    telefonos: '334 4105 · 315 8230285',
    correo: 'ce_nino@hotmail.com',
    horarioAtencion: '',
    urlMapa: '',
    urlFacebook: 'https://www.facebook.com/cenj.bq',
    politicaTratamientoDatos: '',
    portadaEtiqueta: 'CENTRO EDUCATIVO · BARRANQUILLA',
    portadaTitulo: 'Una comunidad que',
    portadaDestacado: 'aprende y crece.',
    portadaTexto:
      'Formación integral, valores y compromiso con el entorno. Conoce lo que nos define como comunidad educativa.',
    quienesPrincipal:
      'Somos una Institución de educación preescolar, básica primaria, básica secundaria y media vocacional orientada a la excelente formación integral de personas competentes y críticas; con valores y comprometidas con el medio ambiente.',
    quienesSecundario:
      'Somos reconocidos por nuestra excelente formación académica, con profundización en el idioma inglés, encaminada a la formación de valores, el cuidado del medio ambiente, el amor por la ciencia, la investigación y el arte.',
    enfoqueTitulo: 'Aprender haciendo, pensar con autonomía',
    enfoqueTexto:
      'El estudiante construye sus propios conocimientos a través de la mediación docente. El constructivismo favorece la autonomía, el liderazgo y el sentido de pertenencia para ser gestores y promotores de cambio.',
    enfoquePasos: 'Explorar, Preguntar, Construir, Reflexionar',
    enfoqueNota: 'Experiencias cercanas, diálogo, trabajo colaborativo y reflexión sobre lo aprendido.',
    horizontePendienteValidacion: true,
    contactoTitulo: 'Conversemos en Barranquilla',
    contactoTexto: 'Resolvemos tus dudas sobre admisiones, grupos extracurriculares y servicios del colegio.',
    pieDescripcion:
      'Garantizando una formación intelectual y en valores cívicos con profunda conciencia del cuidado del medio ambiente y bilingüismo avanzado.',
  },
  elementos: [
    el(1, 'dato_destacado', 0, 'Preescolar a Media', 'Cuatro niveles de formación'),
    el(2, 'dato_destacado', 1, 'A+', 'Categoría en Pruebas Saber'),
    el(3, 'dato_destacado', 2, '6', 'Áreas de formación'),
    el(4, 'dato_destacado', 3, 'EN', 'Énfasis en inglés'),
    el(5, 'valor', 0, 'Autonomía', 'Pensar y actuar con responsabilidad.', { icono: '🧭' }),
    el(6, 'valor', 1, 'Liderazgo', 'Participar y aportar a la comunidad.', { icono: '🚀' }),
    el(7, 'valor', 2, 'Pertenencia', 'Cuidar los vínculos y el entorno escolar.', { icono: '🤝' }),
    el(8, 'valor', 3, 'Cuidado ambiental', 'Reconocer nuestra responsabilidad con la naturaleza.', { icono: '🌱' }),
    el(9, 'oferta', 0, 'Danza y arte', 'Reconocemos al individuo en su integralidad: la danza y el arte como escenario de expresión, conocimiento de sí mismo y aprendizaje.', { icono: 'arte' }),
    el(10, 'oferta', 1, 'Deportes', 'Concientizamos sobre los beneficios de la práctica deportiva para formar personas integrales, útiles en la sociedad.', { icono: 'deporte' }),
    el(11, 'oferta', 2, 'Música', 'Un espacio de instrucción musical con personal idóneo y a la vanguardia de la pedagogía, para desarrollar talentos.', { icono: 'musica' }),
    el(12, 'oferta', 3, 'Literatura', 'Conectamos a los estudiantes con la visión de mundo de la literatura, desarrollando su capacidad comprensiva y crítica.', { icono: 'lit' }),
    el(13, 'oferta', 4, 'Énfasis en inglés', 'Herramientas didácticas y pedagógicas para desarrollar su competencia en el idioma universal.', { icono: 'ingles' }),
    el(14, 'oferta', 5, 'Ciencia y tecnología', 'Los mantenemos al tanto de los últimos avances científicos y tecnológicos y su uso en el entorno escolar.', { icono: 'ciencia' }),
    el(15, 'directivo', 0, 'Miryam Junco Martínez', 'Rectora'),
    el(16, 'directivo', 1, 'Dina Luz Lauren', 'Coordinadora general', { detalle: 'coordinacion@ceninojesus.edu.co' }),
    el(17, 'directivo', 2, 'Erica Arévalo', 'Psicóloga', { detalle: 'psicologia@ceninojesus.edu.co' }),
    el(18, 'galeria', 0, 'Cultura y expresión', 'Estudiantes con tambor en una muestra cultural', { imagen: '/img/galeria-drums.jpg' }),
    el(19, 'galeria', 1, 'Danza y movimiento', 'Estudiantes en actividad de expresión corporal', { imagen: '/img/galeria-baile.jpg' }),
    el(20, 'galeria', 2, 'Deporte y trabajo en equipo', 'Estudiantes jugando voleibol', { imagen: '/img/galeria-voleibol.jpg' }),
    el(21, 'galeria', 3, 'Proyectos de aula', 'Estudiantes con su proyecto de redes sociales', { imagen: '/img/galeria-proyecto.jpg' }),
    el(22, 'galeria', 4, 'Ciencia y experimentación', 'Estudiantes en el laboratorio de ciencias', { imagen: '/img/galeria-laboratorio.jpg' }),
  ],
}

/** Imágenes incluidas con el sitio: se usan mientras la institución no suba las suyas. */
export const IMAGENES_POR_DEFECTO = {
  imagen_portada: { src: '/img/hero-colegio.jpg', alt: 'Estudiantes del Centro Educativo El Niño Jesús en actividades escolares' },
  imagen_quienes: { src: '/img/quienes-somos.jpg', alt: 'Estudiantes en actividades de danza, títeres y laboratorio' },
  imagen_enfoque: { src: '/img/foto-constructivismo.webp', alt: 'Estudiantes pintando en un taller de arte' },
} as const
