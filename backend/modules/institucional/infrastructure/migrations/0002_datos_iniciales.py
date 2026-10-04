"""Datos públicos iniciales del colegio (Informe Ejecutivo, sección A). Se completan desde el admin."""

from django.db import migrations


def crear_informacion(apps, schema_editor):
    Informacion = apps.get_model("institucional", "InformacionInstitucionalModel")
    if not Informacion.objects.exists():
        Informacion.objects.create(
            nombre="Centro Educativo El Niño Jesús",
            direccion="Cl. 38b #4-35, Sur Oriente",
            ciudad="Barranquilla, Atlántico",
            url_facebook="https://web.facebook.com/cenj.bq",
        )


class Migration(migrations.Migration):
    dependencies = [
        ("institucional", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(crear_informacion, migrations.RunPython.noop),
    ]
