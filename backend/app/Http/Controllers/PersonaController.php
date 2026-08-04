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
        $proxyUrl = env('HTTP_PROXY_URL', null);

        try {
            // Opciones de la petición HTTP
            $client = Http::withoutVerifying()->timeout(8);

            // Si hay un Proxy configurado en la variable HTTP_PROXY_URL, lo aplicamos
            if ($proxyUrl) {
                $client = $client->withOptions([
                    'proxy' => $proxyUrl,
                ]);
            }

            $response = $client->withHeaders([
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

            return response()->json([
                'status' => 'warning',
                'message' => 'Servidor del Municipio no disponible temporalmente en la nube.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Servidor del Municipio temporalmente inaccesible.'
            ]);
        }
    }
}
