<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PersonaController extends Controller
{
    public function consultar(Request $request)
    {
        // 1. Validar los datos recibidos desde el Frontend
        $validated = $request->validate([
            'strIdentificacion' => 'required|string',
            'strTipoIdentificacion' => 'nullable|string',
            'strAccion' => 'nullable|string',
        ]);

        $apiUrl = env('QUITO_API_URL', 'https://psmbackend.quito.gob.ec/api/persona/consultar-persona');

        try {
            // 2. Consumir la API con User-Agent de navegador para burlar geobloqueo simple y timeout de 6s
            $response = Http::withoutVerifying()
                ->timeout(6)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'application/json, text/plain, */*',
                    'Accept-Language' => 'es-ES,es;q=0.9',
                ])
                ->post($apiUrl, [
                    'strIdentificacion' => $validated['strIdentificacion'],
                    'strTipoIdentificacion' => $validated['strTipoIdentificacion'] ?? 'C',
                    'strAccion' => $validated['strAccion'] ?? '1',
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            // Fallback elegante
            return response()->json([
                'status' => 'warning',
                'message' => 'Servidor del Municipio no disponible temporalmente en la nube.'
            ]);

        } catch (\Exception $e) {
            // Fallback transparente sin romper el frontend
            return response()->json([
                'status' => 'warning',
                'message' => 'Servidor del Municipio temporalmente inaccesible.'
            ]);
        }
    }
}
