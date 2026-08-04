<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SriController extends Controller
{
    public function consultarRuc(Request $request)
    {
        $request->validate([
            'numDoc' => 'required|string',
        ]);

        $numDoc = trim($request->numDoc);
        $ruc = strlen($numDoc) === 10 ? $numDoc . '001' : $numDoc;

        try {
            // 🎯 Endpoint oficial del SRI con detalle completo
            $response = Http::withoutVerifying()
                ->timeout(8)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept' => 'application/json',
                ])
                ->get("https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?ruc={$ruc}");

            if (! $response->successful()) {
                return response()->json([
                    'status' => 'success',
                    'existe' => false,
                    'message' => 'No se pudo obtener información del SRI para este documento.'
                ]);
            }

            $data = $response->json();

            // Como devuelve una lista en JSON (array de objetos)
            if (is_array($data) && count($data) > 0) {
                return response()->json([
                    'status' => 'success',
                    'existe' => true,
                    'ruc' => $ruc,
                    'datos' => $data[0] // 👈 Retorna toda la ficha completa del SRI
                ]);
            }

            return response()->json([
                'status' => 'success',
                'existe' => false,
                'message' => 'No se registra un RUC activo en el SRI.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error conectando con el SRI: ' . $e->getMessage()
            ], 500);
        }
    }
}
