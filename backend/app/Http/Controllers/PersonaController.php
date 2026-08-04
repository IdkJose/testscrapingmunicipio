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

        $cedula = trim($validated['strIdentificacion']);
        $apiUrl = env('QUITO_API_URL', 'https://psmbackend.quito.gob.ec/api/persona/consultar-persona');
        $proxyUrl = env('HTTP_PROXY_URL', null);

        // 1. Intentar primero con el Municipio de Quito
        try {
            $client = Http::withoutVerifying()->timeout(5);

            if ($proxyUrl) {
                $client = $client->withOptions(['proxy' => $proxyUrl]);
            }

            $response = $client->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept' => 'application/json, text/plain, */*',
            ])->post($apiUrl, [
                'strIdentificacion' => $cedula,
                'strTipoIdentificacion' => $validated['strTipoIdentificacion'] ?? 'C',
                'strAccion' => $validated['strAccion'] ?? '1',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['PE_DENOMINACION']) || isset($data['PE_NOMBRES'])) {
                    return response()->json($data);
                }
            }
        } catch (\Exception $e) {
            // Ignorar y pasar al respaldo inteligente por SRI
        }

        // 2. RESPALDO INTELIGENTE CON EL CATASTRO DEL SRI (100% Funcional en la nube sin bloqueos de IP)
        try {
            $rucConsulta = strlen($cedula) === 10 ? $cedula . '001' : $cedula;

            $sriResponse = Http::withoutVerifying()
                ->timeout(5)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept' => 'application/json',
                ])
                ->get("https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc?ruc={$rucConsulta}");

            if ($sriResponse->successful()) {
                $sriData = $sriResponse->json();
                if (is_array($sriData) && count($sriData) > 0 && isset($sriData[0]['razonSocial'])) {
                    $razonSocial = $sriData[0]['razonSocial'];
                    
                    return response()->json([
                        'PE_PERSONA_ID' => '0',
                        'PE_DENOMINACION' => $razonSocial,
                        'PE_NOMBRES' => $razonSocial,
                        'PE_APELLIDOS' => '',
                        'PE_NUM_IDENTIFICACION' => $cedula,
                        'PE_TIP_IDENTIFICACION' => 'C',
                        'PE_TIP_PERSONA' => $sriData[0]['tipoContribuyente'] === 'PERSONA NATURAL' ? 'N' : 'J',
                        'PE_FECHA_NACIMIENTO' => null,
                        'PE_ESTADO_CIVIL' => 'N/A',
                        'PE_NOMBRE_CONYUGE' => null
                    ]);
                }
            }
        } catch (\Exception $e) {
            //
        }

        return response()->json([
            'status' => 'warning',
            'message' => 'No se encontraron datos registrados para esta cédula.'
        ]);
    }
}
