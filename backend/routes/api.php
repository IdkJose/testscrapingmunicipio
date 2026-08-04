<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PersonaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// 1. Ruta pública para iniciar sesión
Route::post('/login', [AuthController::class, 'login']);

// 2. Rutas PROTEGIDAS con Token (Solo accesibles si estás logueado)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Obtener los datos del usuario logueado
    Route::get('/me', function (Request $request) {
        return response()->json($request->user());
    });

    // 🔒 Consulta al Municipio ahora protegida
    Route::post('/persona/consultar', [PersonaController::class, 'consultar']);
});
