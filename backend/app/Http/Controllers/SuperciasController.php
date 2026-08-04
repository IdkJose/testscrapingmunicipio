<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SuperciasController extends Controller
{
    public function consultarCompanias(Request $request)
    {
        $request->validate([
            'numDoc' => 'required|string',
        ]);

        $numDoc = trim($request->numDoc);

        try {
            // Consulta de participación en compañías en la Superintendencia de Compañías
            $response = Http::withoutVerifying()
                ->timeout(5)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept' => 'application/json',
                ])
                ->get("https://servicios.supercias.gob.ec/consultaCompania/buscarPorIdentificacion/{$numDoc}");

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'status' => 'success',
                    'companias' => is_array($data) ? $data : []
                ]);
            }

            return response()->json([
                'status' => 'success',
                'companias' => []
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'warning',
                'message' => 'No se registraron compañías o cargos en la Superintendencia de Compañías.',
                'companias' => []
            ]);
        }
    }
}
