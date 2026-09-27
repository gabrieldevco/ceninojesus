# Plataforma Web Institucional — Centro Educativo El Niño Jesús

Proyecto de **Práctica Social** del programa de Ingeniería de Sistemas de la **Universidad Libre Seccional Barranquilla** (Facultad de Ingeniería — Proyección Social).

## Descripción

El Centro Educativo El Niño Jesús (Cl. 38b #4-35, Sur Oriente, Barranquilla, Atlántico) no cuenta con un sitio web propio; su única presencia digital es su [página de Facebook](https://web.facebook.com/cenj.bq). Este proyecto busca diseñar e implementar una plataforma web institucional que:

1. **Dé a conocer el colegio** ante la comunidad (historia, misión, visión, contacto y ubicación).
2. Sirva como **portal de acceso** al sistema administrativo existente (notas, tareas, evidencias) y a la biblioteca.
3. Gestione la **matrícula a grupos extracurriculares** (ajedrez, robótica y otros), con aprobación por parte de un administrador independiente de cada grupo.
4. Permita a cada administrador de grupo publicar **contenido educativo** y actividades de apoyo, con una dinámica similar a un LMS tipo Moodle.
5. Capte a los **interesados en la matrícula general** mediante un formulario con un flujo (workflow) automatizado de seguimiento.

## Estructura del repositorio

```
ceninojesus/
├── backend/    # API, lógica de negocio y base de datos
├── frontend/   # Sitio web institucional y portales de usuario
└── README.md
```

## Módulos y requerimientos funcionales

| Módulo | Requerimientos |
|---|---|
| Sitio web institucional | RF-01 a RF-03: información institucional, enlace a redes sociales, formulario de contacto |
| Portal de acceso | RF-04 a RF-06: acceso al sistema administrativo y a la biblioteca, autenticación de usuarios |
| Matrícula a grupos extracurriculares | RF-07 a RF-11: solicitud de los padres, notificación al administrador, aprobación o rechazo, estados (pendiente / aprobada / rechazada), notificación del resultado |
| Contenido educativo por grupo (tipo LMS) | RF-12 a RF-15: publicación de material y actividades, acceso restringido a los estudiantes aprobados |
| Interesados y workflow de seguimiento | RF-16 a RF-19: formulario, base de datos centralizada, recordatorios automáticos, estados (nuevo / en seguimiento / matriculado / descartado) |
| General | RF-20: panel administrativo de usuarios, roles y permisos |

### Roles del sistema

- **Visitante:** consulta la información pública y diligencia los formularios de contacto o de interés.
- **Padre/acudiente:** solicita la matrícula de sus hijos a los grupos extracurriculares.
- **Estudiante:** consulta el material y las actividades de los grupos en los que fue aprobado.
- **Administrador de grupo:** aprueba solicitudes y publica el contenido de su grupo.
- **Administrador general:** gestiona usuarios, roles y permisos.

## Requerimientos no funcionales

- **Usabilidad:** diseño responsive, adaptable a dispositivos móviles.
- **Disponibilidad:** al menos el 95 % del tiempo.
- **Seguridad:** contraseñas cifradas y control de acceso basado en roles.
- **Rendimiento:** tiempo de carga inferior a 3 segundos en condiciones normales.
- **Escalabilidad:** se pueden agregar nuevos grupos extracurriculares sin rediseñar el sistema.
- **Mantenibilidad:** código documentado y organizado de forma modular.
- **Compatibilidad:** Chrome, Firefox, Edge y Safari.
- **Portabilidad:** se puede alojar en un servicio de hosting estándar.
- **Respaldo:** copias de seguridad periódicas.
- **Cumplimiento normativo:** tratamiento de datos personales (incluidos los de menores de edad) conforme a la **Ley 1581 de 2012**.

## Plan de trabajo

Total: **144 horas-persona** (48 horas obligatorias × 3 estudiantes).

| # | Actividad | Horas-persona | Entregable |
|---|---|---|---|
| 1 | Levantamiento de requerimientos | 9 h | Acta de compromiso firmada |
| 2 | Diseño del sitio web institucional | 18 h | Mockups aprobados |
| 3 | Desarrollo del portal de acceso | 26 h | Portal funcional en pruebas |
| 4 | Gestión de matrícula a grupos extracurriculares | 28 h | Flujo de matrícula funcional |
| 5 | Contenido educativo por grupo (tipo LMS) | 22 h | Módulo de contenido funcional |
| 6 | Formulario de interesados y workflow de seguimiento | 26 h | Formulario y workflow operativos |
| 7 | Publicación y capacitación | 15 h | Sitio en producción y acta de entrega |

**Estado actual:** Fase 1 (levantamiento de requerimientos) completada. El acta de compromiso No. 001 se firmó el 21 de septiembre de 2026.

## Equipo

**Equipo de desarrollo (Universidad Libre)**
- Gabriel Andrés Padilla Suárez
- Juan Felipe Noguera Acendra
- Harlem Josué Hernández Marún

**Docente tutor:** Emiro Berrio — Universidad Libre Seccional Barranquilla

**Por parte de la institución**
- Miryam Junco Martínez — Rectora y representante legal
- Harold Amado — Coordinador académico y enlace institucional
- Raúl Medina — Docente de informática y enlace técnico de los grupos extracurriculares
