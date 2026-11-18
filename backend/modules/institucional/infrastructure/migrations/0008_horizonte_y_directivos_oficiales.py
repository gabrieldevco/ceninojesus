"""Misión, visión, teléfono, correo y directivos oficiales entregados por la institución (noviembre de 2026).

Solo reemplaza los textos de ejemplo que cargó la migración 0006: si la institución ya los cambió desde el
panel de administración, se respetan sus cambios. La reseña histórica oficial se publicará más adelante,
por eso la historia de ejemplo se deja vacía (la página omite las secciones sin texto).
"""

from django.db import migrations

HISTORIA_DE_EJEMPLO = (
    "Nuestra historia se construye en los vínculos entre estudiantes, docentes y familias, "
    "y en las experiencias compartidas de aprendizaje."
)
MISION_DE_EJEMPLO = (
    "Acompañar la formación integral de personas críticas y autónomas, que construyan conocimiento, "
    "vivan sus valores y contribuyan al cuidado del medio ambiente."
)
VISION_DE_EJEMPLO = (
    "Una comunidad de aprendizaje que impulse el liderazgo, la investigación, el arte y la participación "
    "responsable de sus estudiantes."
)
TELEFONOS_ANTERIORES = "334 4105 · 315 8230285"
CORREO_ANTERIOR = "ce_nino@hotmail.com"

MISION = "\n\n".join(
    [
        "El Centro Educativo El Niño Jesús tiene como misión brindar una educación integral, inclusiva, "
        "humanista y de calidad desde la educación inicial y preescolar hasta la educación básica y media, "
        "reconociendo a cada estudiante como sujeto de derechos, protagonista de su aprendizaje y constructor "
        "de su proyecto de vida.",
        "A través de una propuesta pedagógica fundamentada en el aprendizaje significativo, el enfoque "
        "constructivista, la exploración, el juego, la investigación, la creatividad y el desarrollo del "
        "pensamiento crítico, promovemos en nuestros estudiantes el fortalecimiento de competencias básicas, "
        "ciudadanas, socioemocionales, comunicativas, científicas, tecnológicas y laborales, de acuerdo con su "
        "edad, nivel de desarrollo, intereses y capacidades.",
        "Nuestra misión se orienta a garantizar una educación inclusiva y equitativa, que reconozca y valore la "
        "diversidad, elimine barreras para el aprendizaje y la participación y genere los apoyos y ajustes "
        "pedagógicos necesarios para que todos los niños, niñas, adolescentes y jóvenes desarrollen sus "
        "potencialidades en ambientes seguros, protectores y respetuosos de su dignidad.",
        "Fortalecemos desde los primeros años el desarrollo emocional y socioemocional, favoreciendo el "
        "reconocimiento, expresión y manejo adecuado de las emociones, la autoestima, la empatía, la autonomía, "
        "la toma responsable de decisiones y la resolución pacífica de conflictos. De igual manera, promovemos "
        "la formación para la ciudadanía, los derechos humanos y la Cátedra de Paz, contribuyendo a la "
        "construcción de relaciones basadas en el respeto, el diálogo, la solidaridad, la convivencia y la "
        "cultura de paz.",
        "Como parte de nuestro compromiso con las necesidades del mundo contemporáneo, desarrollamos una "
        "Política Institucional de Bilingüismo que propicia el aprendizaje progresivo de una segunda lengua, "
        "especialmente el inglés, como herramienta para la comunicación, el intercambio cultural, el acceso al "
        "conocimiento y la ampliación de oportunidades académicas, personales y sociales.",
        "Asimismo, estimulamos el pensamiento científico, tecnológico, innovador y ambiental, promoviendo la "
        "curiosidad, la investigación, la solución de problemas, el uso responsable de las tecnologías y la "
        "construcción de conocimientos orientados a comprender y transformar positivamente el entorno. Formamos "
        "estudiantes conscientes de su responsabilidad frente al cuidado de la naturaleza, la protección del "
        "medio ambiente y la construcción de sociedades sostenibles.",
        "El Centro Educativo El Niño Jesús fortalece la articulación entre familia, escuela y sociedad, "
        "promoviendo la participación y corresponsabilidad de las familias en los procesos educativos y "
        "formativos, con el propósito de acompañar de manera integral el desarrollo de los estudiantes y la "
        "construcción de sus proyectos de vida.",
        "De esta manera, nuestra misión es formar personas íntegras, autónomas, críticas, creativas, "
        "emocionalmente competentes, inclusivas, respetuosas de la diversidad, comprometidas con la paz, "
        "capaces de comunicarse en diferentes contextos, interesadas por la ciencia y la tecnología, "
        "responsables con el medio ambiente y preparadas para afrontar los desafíos de la vida personal, "
        "académica, laboral y social, contribuyendo activamente a la transformación positiva de su contexto y "
        "de la sociedad.",
    ]
)
VISION = (
    "En el año 2029 el Centro Educativo El Niño Jesús será reconocido como una institución líder en el sector "
    "por la formación integral de sus estudiantes, basados en un enfoque de mejora continua y con el firme "
    "compromiso de brindar a la comunidad bachilleres académicos con profundización en artes, creando espacios "
    "de mentalidades progresistas, proactivas, emprendedoras, que permitirán la formación de un individuo "
    "autocrítico, con valores, preocupado por el cuidado de su medio ambiente, por su identidad cultural y por "
    "su prójimo."
)

# (nombre anterior, cargo anterior) -> (nombre oficial, cargo oficial)
DIRECTIVOS = {
    ("Dina Luz Lauren", "Coordinadora general"): ("Harold Amado", "Coordinador general"),
    ("Erica Arévalo", "Psicóloga"): ("Shaiddy Portela", "Psicóloga"),
}


def aplicar(apps, schema_editor):
    Informacion = apps.get_model("institucional", "InformacionInstitucionalModel")
    Elemento = apps.get_model("institucional", "ElementoLandingModel")

    informacion = Informacion.objects.first()
    if informacion is not None:
        cambios = []
        if informacion.historia == HISTORIA_DE_EJEMPLO:
            informacion.historia = ""
            cambios.append("historia")
        if informacion.mision in ("", MISION_DE_EJEMPLO):
            informacion.mision = MISION
            cambios.append("mision")
        if informacion.vision in ("", VISION_DE_EJEMPLO):
            informacion.vision = VISION
            cambios.append("vision")
        if informacion.telefonos == TELEFONOS_ANTERIORES:
            informacion.telefonos = "315 8230285"
            cambios.append("telefonos")
        if informacion.correo == CORREO_ANTERIOR:
            informacion.correo = "ce_ninojesus@hotmail.com"
            cambios.append("correo")
        if {"mision", "vision"} <= set(cambios):
            informacion.horizonte_pendiente_validacion = False
            cambios.append("horizonte_pendiente_validacion")
        if cambios:
            informacion.save(update_fields=cambios)

    for (nombre, cargo), (nuevo_nombre, nuevo_cargo) in DIRECTIVOS.items():
        Elemento.objects.filter(seccion="directivo", titulo=nombre, texto=cargo).update(
            titulo=nuevo_nombre, texto=nuevo_cargo
        )


class Migration(migrations.Migration):
    dependencies = [
        ("institucional", "0007_imagen_enfoque_webp"),
    ]

    operations = [
        migrations.RunPython(aplicar, migrations.RunPython.noop),
    ]
