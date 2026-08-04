#!/bin/sh
set -e

# Crear .env si no existe
if [ ! -f .env ]; then
    echo "Creando archivo .env en contenedor..."
    touch .env
fi

# Inyectar APP_KEY en el .env si no existe
if ! grep -q "APP_KEY=" .env; then
    echo "Configurando APP_KEY..."
    echo "APP_KEY=base64:GK850+fYpWu0R1MNrAqgjZkWjZhWrIzTVqLfFMhFRnY=" >> .env
fi

# Generar clave de producción por seguridad
php artisan key:generate --force || true

# Correr migraciones automáticamente si hay BD configurada
echo "Ejecutando migraciones de base de datos..."
php artisan migrate --force || true

# Iniciar servidor Laravel
echo "Iniciando servidor Laravel..."
exec php artisan serve --host=0.0.0.0 --port=8000
