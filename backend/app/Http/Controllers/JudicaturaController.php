<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class JudicaturaController extends Controller
{
    public function consultarJuicios(Request $request)
    {
        $request->validate([
            'cedula' => 'required|string',
        ]);

        $cedula = $request->cedula;

        try {
            // Desactivar verificación de SSL para evitar bloqueos del servidor estatal
            $response = Http::withoutVerifying()
                ->timeout(10)
                ->retry(2, 200)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ])->post('https://api.funcionjudicial.gob.ec/EXPEDIENTES-WEB/api/v1/formulario-persona/buscar-causas-por-cedula', [
                    'cedulaActor' => '',
                    'cedulaDemandado' => $cedula,
                    'nombreActor' => '',
                    'nombreDemandado' => '',
                    'page' => 1,
                    'size' => 20
                ]);

            if (! $response->successful()) {
                return response()->json([
                    'status' => 'success',
                    'total' => 0,
                    'juicios' => []
                ]);
            }

            $data = $response->json();

            return response()->json([
                'status' => 'success',
                'total' => is_array($data) ? count($data) : 0,
                'juicios' => is_array($data) ? $data : []
            ]);

        } catch (\Exception $e) {
            // Si la API estatal falla o se cae, devolvemos un estado seguro sin romper el frontend
            return response()->json([
                'status' => 'warning',
                'message' => 'Servidor de la Judicatura no disponible temporalmente',
                'juicios' => []
            ]);
        }
    }
}
