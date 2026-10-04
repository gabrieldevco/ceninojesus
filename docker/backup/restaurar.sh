#!/bin/sh
# Restaura una copia de la base de datos generada por respaldar.sh.
#
# Uso (desde la raíz del proyecto):
#   docker compose exec backup sh /scripts/restaurar.sh db_AAAAMMDD_HHMMSS.dump [base_destino]
#
# Sin base_destino restaura sobre la base principal (POSTGRES_DB), REEMPLAZANDO sus datos.
# Para revisar una copia sin tocar la principal, indique otra base (se crea si no existe).

set -e

ARCHIVO="$1"
BASE="${2:-$POSTGRES_DB}"
export PGPASSWORD="$POSTGRES_PASSWORD"

if [ -z "$ARCHIVO" ]; then
    echo "Uso: restaurar.sh <archivo.dump> [base_destino]"
    echo "Copias disponibles:"
    ls -1t /backups | grep '^db_' || echo "  (ninguna)"
    exit 1
fi

case "$ARCHIVO" in
    /*) RUTA="$ARCHIVO" ;;
    *) RUTA="/backups/$ARCHIVO" ;;
esac

if [ ! -f "$RUTA" ]; then
    echo "No existe la copia $RUTA"
    exit 1
fi

if [ "$BASE" != "$POSTGRES_DB" ]; then
    psql -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tc "SELECT 1 FROM pg_database WHERE datname = '$BASE'" \
        | grep -q 1 || createdb -h db -U "$POSTGRES_USER" "$BASE"
fi

echo "Restaurando $RUTA en la base '$BASE'..."
pg_restore -h db -U "$POSTGRES_USER" -d "$BASE" --clean --if-exists --no-owner "$RUTA"
echo "Restauración terminada."
