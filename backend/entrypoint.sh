#!/bin/sh
set -e

# Crear .env si no existe para evitar que key:generate falle
if [ ! -f .env ]; then
    echo "Creando archivo .env desde .env.example o plantilla..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        touch .env
    fi
fi

# Correr migraciones automáticamente si hay BD configurada
echo "Ejecutando migraciones de base de datos..."
php artisan migrate --force || true

# Iniciar servidor Laravel
echo "Iniciando servidor Laravel..."
exec php artisan serve --host=0.0.0.0 --port=8000
