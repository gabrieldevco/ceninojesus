export const USERS = {
  'padre@demo.com':      { role: 'padre',      name: 'Acudiente demo A', label: 'Padre / acudiente', home: '/familias/matricula' },
  'estudiante@demo.com': { role: 'estudiante', name: 'Estudiante demo A', label: 'Estudiante',        home: '/estudiante/aula' },
  'admin@demo.com':      { role: 'admin',      name: 'Admin Robótica',   label: 'Administrador de grupo', home: '/admin/solicitudes' },
}
export const DEMO_PASSWORD = 'demo1234'

export const GROUPS = ['Ajedrez', 'Robótica', 'Danza y arte', 'Música']
export const STUDENTS = ['Estudiante demo A', 'Estudiante demo B']

export const GROUP_INFO = {
  'Ajedrez': { tagline: 'Piensa antes de mover. Recursos de demostración para explorar estrategias y aprender las reglas del juego.', icon: '♞' },
  'Danza y arte': { tagline: 'Expresión, ritmo y creatividad. Material de demostración para cada sesión.', icon: '✺' },
  'Robótica': { tagline: 'Construye, programa y prueba. Material de demostración del grupo.', icon: '⚙' },
  'Música': { tagline: 'Escucha, practica y comparte. Material de demostración del grupo.', icon: '♪' },
}

export const MATERIALS = {
  'Ajedrez': [
    { id: 1, type: 'doc',   title: 'Guía: el tablero y las piezas', meta: 'PDF · 6 páginas · Publicado: 01 oct 2026', tag: 'Documento', action: 'Consultar documento' },
    { id: 2, type: 'video', title: 'Cómo se mueve cada pieza',      meta: 'Video · 08:20 min · Publicado: 02 oct 2026', tag: 'Video', action: 'Ver video' },
    { id: 3, type: 'link',  title: 'Explora posiciones de apertura', meta: 'Recurso externo · Publicado: 02 oct 2026', tag: 'Enlace', action: 'Consultar enlace' },
  ],
  'Danza y arte': [
    { id: 4, type: 'doc',   title: 'Ritmos y compases: introducción', meta: 'PDF · 4 páginas · Publicado: 01 oct 2026', tag: 'Documento', action: 'Consultar documento' },
    { id: 5, type: 'video', title: 'Calentamiento en 10 minutos',     meta: 'Video · 10:00 min · Publicado: 02 oct 2026', tag: 'Video', action: 'Ver video' },
  ],
}

export const seedRequests = [
  { id: 1, student: 'Estudiante demo A', guardian: 'Acudiente demo A', email: 'familia.a@example.com', group: 'Robótica',     date: '2026-10-03', status: 'pendiente' },
  { id: 2, student: 'Estudiante demo A', guardian: 'Acudiente demo A', email: 'familia.a@example.com', group: 'Ajedrez',      date: '2026-10-01', status: 'aprobada' },
  { id: 3, student: 'Estudiante demo A', guardian: 'Acudiente demo A', email: 'familia.a@example.com', group: 'Danza y arte', date: '2026-10-01', status: 'aprobada' },
  { id: 4, student: 'Estudiante demo B', guardian: 'Acudiente demo A', email: 'familia.a@example.com', group: 'Música',       date: '2026-09-30', status: 'rechazada', reason: 'Cupo no disponible' },
  { id: 5, student: 'Estudiante demo B', guardian: 'Acudiente demo B', email: 'familia.b@example.com', group: 'Robótica',     date: '2026-10-03', status: 'pendiente' },
  { id: 6, student: 'Estudiante demo C', guardian: 'Acudiente demo C', email: 'familia.c@example.com', group: 'Robótica',     date: '2026-10-02', status: 'pendiente' },
  { id: 7, student: 'Estudiante demo D', guardian: 'Acudiente demo D', email: 'familia.d@example.com', group: 'Robótica',     date: '2026-10-01', status: 'aprobada' },
  { id: 8, student: 'Estudiante demo E', guardian: 'Acudiente demo E', email: 'familia.e@example.com', group: 'Robótica',     date: '2026-10-01', status: 'aprobada' },
  { id: 9, student: 'Estudiante demo F', guardian: 'Acudiente demo F', email: 'familia.f@example.com', group: 'Robótica',     date: '2026-09-30', status: 'rechazada', reason: 'Cupo no disponible' },
]

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
export const fmtDate = (iso) => { const [y,m,d] = iso.split('-'); return `${d} ${MESES[+m-1]} ${y}` }
