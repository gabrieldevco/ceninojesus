"""La imagen del enfoque constructivista pasó de PNG a WebP (pesa ~90 % menos)."""

from django.db import migrations

ANTES = "/img/foto-constructivismo.png"
AHORA = "/img/foto-constructivismo.webp"


def cambiar_ruta(apps, schema_editor, desde, hacia):
    Elemento = apps.get_model("institucional", "ElementoLandingModel")
    # Solo si conserva la imagen incluida con el sitio: no toca la que la institución haya cambiado
    Elemento.objects.filter(seccion="imagen_enfoque", imagen_estatica=desde).update(imagen_estatica=hacia)


class Migration(migrations.Migration):
    dependencies = [
        ("institucional", "0006_contenido_inicial_landing"),
    ]

    operations = [
        migrations.RunPython(
            lambda apps, editor: cambiar_ruta(apps, editor, ANTES, AHORA),
            lambda apps, editor: cambiar_ruta(apps, editor, AHORA, ANTES),
        ),
    ]
