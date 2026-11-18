"""Instagram de la institución y la página de Facebook oficial (entregadas por coordinación, noviembre de 2026)."""

from django.db import migrations, models

FACEBOOKS_ANTERIORES = ("", "https://www.facebook.com/cenj.bq", "https://web.facebook.com/cenj.bq")
FACEBOOK = "https://www.facebook.com/share/1EAp6wkQwV/"
INSTAGRAM = "https://www.instagram.com/ceninojesus/"


def cargar_redes(apps, schema_editor):
    Informacion = apps.get_model("institucional", "InformacionInstitucionalModel")
    informacion = Informacion.objects.first()
    if informacion is None:
        return
    # Solo reemplaza los valores de ejemplo: respeta lo que la institución haya cambiado desde el panel
    if informacion.url_facebook in FACEBOOKS_ANTERIORES:
        informacion.url_facebook = FACEBOOK
    if not informacion.url_instagram:
        informacion.url_instagram = INSTAGRAM
    informacion.save(update_fields=["url_facebook", "url_instagram"])


class Migration(migrations.Migration):
    dependencies = [
        ("institucional", "0008_horizonte_y_directivos_oficiales"),
    ]

    operations = [
        migrations.AddField(
            model_name="informacioninstitucionalmodel",
            name="url_instagram",
            field=models.URLField(blank=True, verbose_name="URL de Instagram"),
        ),
        migrations.RunPython(cargar_redes, migrations.RunPython.noop),
    ]
