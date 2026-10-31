"""Contenido que la página de inicio traía fijo en el código, ahora editable desde el panel de administración."""

from django.db import migrations

TEXTOS = {
    "portada_etiqueta": "CENTRO EDUCATIVO · BARRANQUILLA",
    "portada_titulo": "Una comunidad que",
    "portada_destacado": "aprende y crece.",
    "portada_texto": (
        "Formación integral, valores y compromiso con el entorno. "
        "Conoce lo que nos define como comunidad educativa."
    ),
    "quienes_principal": (
        "Somos una Institución de educación preescolar, básica primaria, básica secundaria y media vocacional "
        "orientada a la excelente formación integral de personas competentes y críticas; con valores y "
        "comprometidas con el medio ambiente."
    ),
    "quienes_secundario": (
        "Somos reconocidos por nuestra excelente formación académica, con profundización en el idioma inglés, "
        "encaminada a la formación de valores, el cuidado del medio ambiente, el amor por la ciencia, "
        "la investigación y el arte."
    ),
    "enfoque_titulo": "Aprender haciendo, pensar con autonomía",
    "enfoque_texto": (
        "El estudiante construye sus propios conocimientos a través de la mediación docente. "
        "El constructivismo favorece la autonomía, el liderazgo y el sentido de pertenencia para ser "
        "gestores y promotores de cambio."
    ),
    "enfoque_pasos": "Explorar, Preguntar, Construir, Reflexionar",
    "enfoque_nota": "Experiencias cercanas, diálogo, trabajo colaborativo y reflexión sobre lo aprendido.",
    "contacto_titulo": "Conversemos en Barranquilla",
    "contacto_texto": "Resolvemos tus dudas sobre admisiones, grupos extracurriculares y servicios del colegio.",
    "pie_descripcion": (
        "Garantizando una formación intelectual y en valores cívicos con profunda conciencia del cuidado "
        "del medio ambiente y bilingüismo avanzado."
    ),
}

# Solo si están vacíos: la institución pudo haberlos completado ya desde el admin
TEXTOS_DEL_HORIZONTE = {
    "historia": (
        "Nuestra historia se construye en los vínculos entre estudiantes, docentes y familias, "
        "y en las experiencias compartidas de aprendizaje."
    ),
    "mision": (
        "Acompañar la formación integral de personas críticas y autónomas, que construyan conocimiento, "
        "vivan sus valores y contribuyan al cuidado del medio ambiente."
    ),
    "vision": (
        "Una comunidad de aprendizaje que impulse el liderazgo, la investigación, el arte y la participación "
        "responsable de sus estudiantes."
    ),
    "telefonos": "334 4105 · 315 8230285",
    "correo": "ce_nino@hotmail.com",
}

# (sección, título, texto, detalle, ícono, imagen incluida con el sitio)
ELEMENTOS = [
    ("dato_destacado", "Preescolar a Media", "Cuatro niveles de formación", "", "", ""),
    ("dato_destacado", "A+", "Categoría en Pruebas Saber", "", "", ""),
    ("dato_destacado", "6", "Áreas de formación", "", "", ""),
    ("dato_destacado", "EN", "Énfasis en inglés", "", "", ""),
    ("valor", "Autonomía", "Pensar y actuar con responsabilidad.", "", "🧭", ""),
    ("valor", "Liderazgo", "Participar y aportar a la comunidad.", "", "🚀", ""),
    ("valor", "Pertenencia", "Cuidar los vínculos y el entorno escolar.", "", "🤝", ""),
    ("valor", "Cuidado ambiental", "Reconocer nuestra responsabilidad con la naturaleza.", "", "🌱", ""),
    (
        "oferta",
        "Danza y arte",
        "Reconocemos al individuo en su integralidad: la danza y el arte como escenario de expresión, "
        "conocimiento de sí mismo y aprendizaje.",
        "",
        "arte",
        "",
    ),
    (
        "oferta",
        "Deportes",
        "Concientizamos sobre los beneficios de la práctica deportiva para formar personas integrales, "
        "útiles en la sociedad.",
        "",
        "deporte",
        "",
    ),
    (
        "oferta",
        "Música",
        "Un espacio de instrucción musical con personal idóneo y a la vanguardia de la pedagogía, "
        "para desarrollar talentos.",
        "",
        "musica",
        "",
    ),
    (
        "oferta",
        "Literatura",
        "Conectamos a los estudiantes con la visión de mundo de la literatura, desarrollando su capacidad "
        "comprensiva y crítica.",
        "",
        "lit",
        "",
    ),
    (
        "oferta",
        "Énfasis en inglés",
        "Herramientas didácticas y pedagógicas para desarrollar su competencia en el idioma universal.",
        "",
        "ingles",
        "",
    ),
    (
        "oferta",
        "Ciencia y tecnología",
        "Los mantenemos al tanto de los últimos avances científicos y tecnológicos y su uso en el entorno escolar.",
        "",
        "ciencia",
        "",
    ),
    ("directivo", "Miryam Junco Martínez", "Rectora", "", "", ""),
    ("directivo", "Dina Luz Lauren", "Coordinadora general", "coordinacion@ceninojesus.edu.co", "", ""),
    ("directivo", "Erica Arévalo", "Psicóloga", "psicologia@ceninojesus.edu.co", "", ""),
    (
        "galeria",
        "Cultura y expresión",
        "Estudiantes con tambor en una muestra cultural",
        "",
        "",
        "/img/galeria-drums.jpg",
    ),
    (
        "galeria",
        "Danza y movimiento",
        "Estudiantes en actividad de expresión corporal",
        "",
        "",
        "/img/galeria-baile.jpg",
    ),
    (
        "galeria",
        "Deporte y trabajo en equipo",
        "Estudiantes jugando voleibol",
        "",
        "",
        "/img/galeria-voleibol.jpg",
    ),
    (
        "galeria",
        "Proyectos de aula",
        "Estudiantes con su proyecto de redes sociales",
        "",
        "",
        "/img/galeria-proyecto.jpg",
    ),
    (
        "galeria",
        "Ciencia y experimentación",
        "Estudiantes en el laboratorio de ciencias",
        "",
        "",
        "/img/galeria-laboratorio.jpg",
    ),
    (
        "imagen_portada",
        "",
        "Estudiantes del Centro Educativo Niño Jesús en actividades escolares",
        "",
        "",
        "/img/hero-colegio.jpg",
    ),
    (
        "imagen_quienes",
        "",
        "Estudiantes en actividades de danza, títeres y laboratorio",
        "",
        "",
        "/img/quienes-somos.jpg",
    ),
    ("imagen_enfoque", "", "Estudiantes pintando en un taller de arte", "", "", "/img/foto-constructivismo.png"),
]


def cargar_contenido(apps, schema_editor):
    Informacion = apps.get_model("institucional", "InformacionInstitucionalModel")
    Elemento = apps.get_model("institucional", "ElementoLandingModel")

    informacion = Informacion.objects.first() or Informacion(nombre="Centro Educativo El Niño Jesús")
    for campo, valor in TEXTOS.items():
        if not getattr(informacion, campo):
            setattr(informacion, campo, valor)
    for campo, valor in TEXTOS_DEL_HORIZONTE.items():
        if not getattr(informacion, campo):
            setattr(informacion, campo, valor)
    informacion.save()

    if Elemento.objects.exists():
        return
    orden_por_seccion = {}
    for seccion, titulo, texto, detalle, icono, imagen in ELEMENTOS:
        orden = orden_por_seccion.get(seccion, 0)
        orden_por_seccion[seccion] = orden + 1
        Elemento.objects.create(
            seccion=seccion,
            titulo=titulo,
            texto=texto,
            detalle=detalle,
            icono=icono,
            imagen_estatica=imagen,
            orden=orden,
        )


class Migration(migrations.Migration):
    dependencies = [
        ("institucional", "0005_landing_editable"),
    ]

    operations = [
        migrations.RunPython(cargar_contenido, migrations.RunPython.noop),
    ]
