<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SenescytController extends Controller
{
    public function consultarTitulos(Request $request)
    {
        $request->validate([
            'cedula' => 'required|string',
        ]);

        $cedula = trim($request->cedula);

        try {
            $response = Http::withoutVerifying()
                ->timeout(8)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept' => 'application/json, text/plain, */*',
                ])
                ->get("https://www.senescyt.gob.ec/consultas-publicas-web/api/v1/titulos/buscar-por-identificacion?identificacion={$cedula}");

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'status' => 'success',
                    'titulos' => is_array($data) ? $data : []
                ]);
            }

            return response()->json([
                'status' => 'success',
                'titulos' => []
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'warning',
                'message' => 'No se pudo conectar con el servicio de la SENESCYT',
                'titulos' => []
            ]);
        }
    }
}
