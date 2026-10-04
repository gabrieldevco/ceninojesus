from django.db import migrations


def asignar_rol_administrador(apps, schema_editor):
    Usuario = apps.get_model("usuarios", "Usuario")
    Usuario.objects.filter(is_superuser=True).update(rol="administrador")


class Migration(migrations.Migration):
    dependencies = [
        ("usuarios", "0002_usuario_rol_usuario_telefono_estudiantemodel"),
    ]

    operations = [
        migrations.RunPython(asignar_rol_administrador, migrations.RunPython.noop),
    ]
