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
    // La reseña histórica oficial se publicará más adelante; mientras tanto la sección muestra misión y visión.
    historia: '',
    mision:
      'El Centro Educativo El Niño Jesús tiene como misión brindar una educación integral, inclusiva, humanista y de calidad desde la educación inicial y preescolar hasta la educación básica y media, reconociendo a cada estudiante como sujeto de derechos, protagonista de su aprendizaje y constructor de su proyecto de vida.\n\nA través de una propuesta pedagógica fundamentada en el aprendizaje significativo, el enfoque constructivista, la exploración, el juego, la investigación, la creatividad y el desarrollo del pensamiento crítico, promovemos en nuestros estudiantes el fortalecimiento de competencias básicas, ciudadanas, socioemocionales, comunicativas, científicas, tecnológicas y laborales, de acuerdo con su edad, nivel de desarrollo, intereses y capacidades.\n\nNuestra misión se orienta a garantizar una educación inclusiva y equitativa, que reconozca y valore la diversidad, elimine barreras para el aprendizaje y la participación y genere los apoyos y ajustes pedagógicos necesarios para que todos los niños, niñas, adolescentes y jóvenes desarrollen sus potencialidades en ambientes seguros, protectores y respetuosos de su dignidad.\n\nFortalecemos desde los primeros años el desarrollo emocional y socioemocional, favoreciendo el reconocimiento, expresión y manejo adecuado de las emociones, la autoestima, la empatía, la autonomía, la toma responsable de decisiones y la resolución pacífica de conflictos. De igual manera, promovemos la formación para la ciudadanía, los derechos humanos y la Cátedra de Paz, contribuyendo a la construcción de relaciones basadas en el respeto, el diálogo, la solidaridad, la convivencia y la cultura de paz.\n\nComo parte de nuestro compromiso con las necesidades del mundo contemporáneo, desarrollamos una Política Institucional de Bilingüismo que propicia el aprendizaje progresivo de una segunda lengua, especialmente el inglés, como herramienta para la comunicación, el intercambio cultural, el acceso al conocimiento y la ampliación de oportunidades académicas, personales y sociales.\n\nAsimismo, estimulamos el pensamiento científico, tecnológico, innovador y ambiental, promoviendo la curiosidad, la investigación, la solución de problemas, el uso responsable de las tecnologías y la construcción de conocimientos orientados a comprender y transformar positivamente el entorno. Formamos estudiantes conscientes de su responsabilidad frente al cuidado de la naturaleza, la protección del medio ambiente y la construcción de sociedades sostenibles.\n\nEl Centro Educativo El Niño Jesús fortalece la articulación entre familia, escuela y sociedad, promoviendo la participación y corresponsabilidad de las familias en los procesos educativos y formativos, con el propósito de acompañar de manera integral el desarrollo de los estudiantes y la construcción de sus proyectos de vida.\n\nDe esta manera, nuestra misión es formar personas íntegras, autónomas, críticas, creativas, emocionalmente competentes, inclusivas, respetuosas de la diversidad, comprometidas con la paz, capaces de comunicarse en diferentes contextos, interesadas por la ciencia y la tecnología, responsables con el medio ambiente y preparadas para afrontar los desafíos de la vida personal, académica, laboral y social, contribuyendo activamente a la transformación positiva de su contexto y de la sociedad.',
    vision:
      'En el año 2029 el Centro Educativo El Niño Jesús será reconocido como una institución líder en el sector por la formación integral de sus estudiantes, basados en un enfoque de mejora continua y con el firme compromiso de brindar a la comunidad bachilleres académicos con profundización en artes, creando espacios de mentalidades progresistas, proactivas, emprendedoras, que permitirán la formación de un individuo autocrítico, con valores, preocupado por el cuidado de su medio ambiente, por su identidad cultural y por su prójimo.',
    direccion: 'Calle 38B # 4-35',
    ciudad: 'Barranquilla - Colombia',
    telefonos: '315 8230285',
    correo: 'ce_ninojesus@hotmail.com',
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
    horizontePendienteValidacion: false,
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
    el(16, 'directivo', 1, 'Harold Amado', 'Coordinador general', { detalle: 'coordinacion@ceninojesus.edu.co' }),
    el(17, 'directivo', 2, 'Shaiddy Portela', 'Psicóloga', { detalle: 'psicologia@ceninojesus.edu.co' }),
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
