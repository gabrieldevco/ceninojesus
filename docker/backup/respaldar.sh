#!/bin/sh
# RNF-09: copias de seguridad periódicas de la base de datos y de los archivos subidos.
#
# Cada BACKUP_INTERVALO_SEGUNDOS (1 día por defecto) genera en /backups:
#   db_AAAAMMDD_HHMMSS.dump        base de datos (formato custom de pg_dump)
#   archivos_AAAAMMDD_HHMMSS.tar.gz material y actividades subidos (media)
# y borra las copias con más de BACKUP_DIAS_RETENCION días (14 por defecto).

DESTINO=/backups
INTERVALO="${BACKUP_INTERVALO_SEGUNDOS:-86400}"
RETENCION="${BACKUP_DIAS_RETENCION:-14}"
export PGPASSWORD="$POSTGRES_PASSWORD"

mkdir -p "$DESTINO"

while true; do
    FECHA=$(date +%Y%m%d_%H%M%S)

    if pg_dump -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "$DESTINO/db_$FECHA.dump.parcial"; then
        mv "$DESTINO/db_$FECHA.dump.parcial" "$DESTINO/db_$FECHA.dump"
        echo "$(date '+%F %T') Copia de la base de datos: db_$FECHA.dump"
    else
        rm -f "$DESTINO/db_$FECHA.dump.parcial"
        echo "$(date '+%F %T') ERROR: falló la copia de la base de datos; se reintenta en 5 minutos."
        sleep 300
        continue
    fi

    if [ -d /media ]; then
        tar -czf "$DESTINO/archivos_$FECHA.tar.gz" -C /media . \
            && echo "$(date '+%F %T') Copia de los archivos: archivos_$FECHA.tar.gz"
    fi

    find "$DESTINO" -name 'db_*.dump' -mtime +"$RETENCION" -delete
    find "$DESTINO" -name 'archivos_*.tar.gz' -mtime +"$RETENCION" -delete

    sleep "$INTERVALO"
done
