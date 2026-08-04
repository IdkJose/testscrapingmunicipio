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

# Asegurar DB_CONNECTION=pgsql en .env si DATABASE_URL existe
if [ -n "$DATABASE_URL" ]; then
    echo "Configurando conexion PostgreSQL..."
    echo "DB_CONNECTION=pgsql" >> .env
    echo "DB_URL=$DATABASE_URL" >> .env
fi

# Correr migraciones automáticamente en PostgreSQL
echo "Ejecutando migraciones de base de datos..."
php artisan migrate --force || true

# Crear usuario administrador por defecto si no existe
echo "Creando usuario administrador si no existe..."
php artisan tinker --execute="if(!\App\Models\User::where('email', 'admin@test.com')->exists()) { \App\Models\User::create(['name' => 'Administrador', 'email' => 'admin@test.com', 'password' => \Illuminate\Support\Facades\Hash::make('12345678')]); }" || true

# Iniciar servidor Laravel
echo "Iniciando servidor Laravel..."
exec php artisan serve --host=0.0.0.0 --port=8000
