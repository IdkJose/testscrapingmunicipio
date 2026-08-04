<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PersonaController;

Route::get('/', function () {
    return view('welcome');
});


Route::get('/ping', function () {
    return response()->json([
        'status' => 'success',
        'message' => '¡Conexión exitosa entre Laravel y Next.js! 🚀',
        'timestamp' => now()
    ]);
});

Route::post('/api/persona/consultar', [PersonaController::class, 'consultar']);