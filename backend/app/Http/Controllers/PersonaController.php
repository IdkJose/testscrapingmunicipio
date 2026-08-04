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
        // 2. Obtener la URL de la API desde el .env
        $apiUrl = env('QUITO_API_URL', 'https://psmbackend.quito.gob.ec/api/persona/consultar-persona');
        try {
            // 3. Consumir la API externa con POST
            $response = Http::post($apiUrl, [
                'strIdentificacion' => $validated['strIdentificacion'],
                'strTipoIdentificacion' => $validated['strTipoIdentificacion'] ?? 'C',
                'strAccion' => $validated['strAccion'] ?? '1',
            ]);
            // 4. Retornar la respuesta JSON al Frontend
            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al consultar la API del Municipio: ' . $e->getMessage()
            ], 500);
        }
    }
}
