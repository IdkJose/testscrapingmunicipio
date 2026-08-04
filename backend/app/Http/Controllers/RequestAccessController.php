<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class RequestAccessController extends Controller
{
    public function solicitarAcceso(Request $request)
    {
        // 1. Anti-Spam: Rate Limiting por IP (Máximo 3 solicitudes por IP cada hora)
        $ipKey = 'request-access:' . $request->ip();
        if (RateLimiter::tooManyAttempts($ipKey, 3)) {
            $seconds = RateLimiter::availableIn($ipKey);
            return response()->json([
                'message' => "Demasiadas solicitudes. Por favor espera {$seconds} segundos antes de intentar de nuevo."
            ], 429);
        }

        // 2. Validación de campos obligatorios
        $request->validate([
            'nombre' => 'required|string|max:100',
            'email' => 'required|email|max:150',
            'motivo' => 'required|string|max:500',
        ]);

        RateLimiter::hit($ipKey, 3600); // 1 hora de timeout por IP

        $nombre = clean_input($request->nombre ?? '');
        $email = clean_input($request->email ?? '');
        $motivo = clean_input($request->motivo ?? '');

        // 3. Enviar correo informativo mediante Mail::raw
        try {
            Mail::raw(
                "Solicitud de Acceso al Perfilador 360°:\n\n" .
                "Nombre Completo: {$request->nombre}\n" .
                "Correo Solicitante: {$request->email}\n" .
                "Motivo de Uso: {$request->motivo}\n\n" .
                "IP de Origen: " . $request->ip() . "\n" .
                "Fecha: " . now()->toDateTimeString(),
                function ($message) use ($request) {
                    $message->to('jherrerauemee@gmail.com') // Tu correo de administrador
                            ->subject('🔐 Nueva Solicitud de Acceso - Perfilador 360°');
                }
            );
        } catch (\Exception $e) {
            // Si el driver de Mail no está configurado localmente en SMTP, registramos en log pero confirmamos al usuario
            \Illuminate\Support\Facades\Log::info("Solicitud de acceso enviada: {$request->email} - {$request->nombre}");
        }

        return response()->json([
            'status' => 'success',
            'message' => '¡Solicitud enviada con éxito! Revisaremos tus datos y te enviaremos la confirmación.'
        ]);
    }
}

function clean_input($data) {
    return htmlspecialchars(stripslashes(trim($data)));
}
