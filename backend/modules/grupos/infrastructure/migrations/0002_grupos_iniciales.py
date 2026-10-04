"""Grupos mencionados en el levantamiento de requerimientos. Se pueden editar o agregar más desde el admin."""

from django.db import migrations

GRUPOS = [
    ("Ajedrez", "Grupo extracurricular de ajedrez."),
    ("Robótica", "Grupo extracurricular de robótica."),
]


def crear_grupos(apps, schema_editor):
    Grupo = apps.get_model("grupos", "GrupoExtracurricularModel")
    for nombre, descripcion in GRUPOS:
        Grupo.objects.get_or_create(nombre=nombre, defaults={"descripcion": descripcion})


class Migration(migrations.Migration):
    dependencies = [
        ("grupos", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(crear_grupos, migrations.RunPython.noop),
    ]
