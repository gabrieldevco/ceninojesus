#!/bin/sh
# Tareas automáticas del servicio "workflow":
#  - RF-18: recordatorios de interesados sin respuesta
#  - Ley 1581: alertas de solicitudes de datos personales por vencer
# Cada WORKFLOW_INTERVALO_SEGUNDOS (1 hora por defecto); si una tarea falla, reintenta al minuto.

INTERVALO="${WORKFLOW_INTERVALO_SEGUNDOS:-3600}"

while true; do
    if python manage.py enviar_recordatorios_interesados && python manage.py alertar_solicitudes_datos; then
        sleep "$INTERVALO"
    else
        echo "Falló una tarea; se reintenta en 60 segundos."
        sleep 60
    fi
done
