#!/bin/sh
# Prepara la base de datos y los estáticos antes de arrancar el servidor
set -e

python manage.py migrate --noinput
python manage.py createcachetable
python manage.py collectstatic --noinput

exec "$@"
