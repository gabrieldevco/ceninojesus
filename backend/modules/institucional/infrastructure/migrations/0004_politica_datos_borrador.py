"""
Borrador inicial de la política de tratamiento de datos (Ley 1581 de 2012, Decreto 1377 de 2013).
DEBE revisarlo y aprobarlo el colegio antes de publicar la plataforma; se edita desde el admin.
"""

from django.db import migrations

POLITICA_BORRADOR = """[BORRADOR — Debe ser revisado y aprobado por el Centro Educativo El Niño Jesús antes de su publicación]

POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES
Centro Educativo El Niño Jesús

1. Responsable del tratamiento
Centro Educativo El Niño Jesús, ubicado en la Cl. 38b #4-35, Sur Oriente, Barranquilla, Atlántico. Canal de atención para asuntos de datos personales: [correo y teléfono por definir].

2. Marco legal
Ley 1581 de 2012, Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas que los modifiquen o complementen.

3. Datos que se recolectan y finalidades
a) Padres, madres y acudientes: nombre, correo, teléfono y usuario de acceso, para gestionar las solicitudes de matrícula a los grupos extracurriculares, enviar notificaciones y dar acceso a la plataforma.
b) Estudiantes (menores de edad): nombre, documento, fecha de nacimiento y grado, para gestionar su inscripción en los grupos extracurriculares y darles acceso al material educativo de los grupos en los que estén inscritos.
c) Interesados en la matrícula: nombre, correo, teléfono y mensaje, para responder su solicitud y hacerle seguimiento.
d) Visitantes que escriben por el formulario de contacto: nombre, correo, teléfono y mensaje, para responder su comunicación.
Los datos no se venden ni se entregan a terceros, salvo obligación legal.

4. Tratamiento de datos de niños, niñas y adolescentes
Se tratan únicamente los datos necesarios para las finalidades educativas descritas, respetando el interés superior del menor y sus derechos fundamentales. La autorización la otorga su padre, madre o acudiente.

5. Derechos de los titulares
Conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización otorgada; ser informado sobre el uso que se ha dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y/o solicitar la supresión de los datos cuando no exista un deber legal o contractual de conservarlos; y acceder gratuitamente a sus datos.

6. Procedimiento para consultas y reclamos
Los titulares pueden radicar su solicitud en la plataforma (sección "Datos personales") o por los canales de atención indicados.
- Consultas: se responden en un máximo de diez (10) días hábiles.
- Reclamos (actualización, rectificación, supresión o revocatoria): se responden en un máximo de quince (15) días hábiles.

7. Seguridad de la información
La información se almacena con contraseñas cifradas, acceso controlado por roles y copias de seguridad periódicas.

8. Vigencia
Esta política rige a partir de su publicación: [fecha por definir]. Las bases de datos se conservarán mientras sea necesario para las finalidades descritas.
"""


def cargar_borrador(apps, schema_editor):
    Informacion = apps.get_model("institucional", "InformacionInstitucionalModel")
    Informacion.objects.filter(politica_tratamiento_datos="").update(politica_tratamiento_datos=POLITICA_BORRADOR)


class Migration(migrations.Migration):
    dependencies = [
        ("institucional", "0003_informacioninstitucionalmodel_politica_tratamiento_datos"),
    ]

    operations = [
        migrations.RunPython(cargar_borrador, migrations.RunPython.noop),
    ]
