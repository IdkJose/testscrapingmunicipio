#!/bin/sh
set -e

# Generar APP_KEY si no existe en la variable de entorno
if [ -z "$APP_KEY" ]; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
fi

# Correr migraciones automáticamente en producción
echo "Ejecutando migraciones de base de datos..."
php artisan migrate --force

# Iniciar servidor Laravel
echo "Iniciando servidor Laravel..."
exec php artisan serve --host=0.0.0.0 --port=8000
