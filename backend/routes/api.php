<?php

use App\Http\Controllers\AntController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\JudicaturaController;
use App\Http\Controllers\PersonaController;
use App\Http\Controllers\RequestAccessController;
use App\Http\Controllers\SenescytController;
use App\Http\Controllers\SriController;
use App\Http\Controllers\SuperciasController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// 1. Rutas públicas (sin token)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/solicitar-acceso', [RequestAccessController::class, 'solicitarAcceso']);


// 2. Rutas PROTEGIDAS con Token (Solo accesibles si estás logueado)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Obtener los datos del usuario logueado
    Route::get('/me', function (Request $request) {
        return response()->json($request->user());
    });

    // 🔒 Consultas del sistema
    Route::post('/persona/consultar', [PersonaController::class, 'consultar']);
    Route::post('/judicatura/consultar', [JudicaturaController::class, 'consultarJuicios']);
    Route::post('/sri/consultar', [SriController::class, 'consultarRuc']);
    Route::post('/senescyt/consultar', [SenescytController::class, 'consultarTitulos']);
    Route::post('/supercias/consultar', [SuperciasController::class, 'consultarCompanias']);
    Route::post('/ant/consultar', [AntController::class, 'consultarPuntosYMultas']);
});



