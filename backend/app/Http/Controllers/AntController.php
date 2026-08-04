<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AntController extends Controller
{
    public function consultarPuntosYMultas(Request $request)
    {
        $request->validate([
            'cedula' => 'required|string',
        ]);

        $cedula = trim($request->cedula);

        try {
            // Petición al Portal WEB JSP Oficial de la ANT
            $url = "https://consultaweb.ant.gob.ec/PortalWEB/paginas/clientes/clp_grid_citaciones.jsp?ps_tipo_identificacion=CED&ps_identificacion={$cedula}&ps_placa=";

            $response = Http::withoutVerifying()
                ->timeout(8)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ])
                ->get($url);

            if ($response->successful()) {
                $html = $response->body();

                $puntos = null;
                if (preg_match('/Puntos:\s*<\/b>\s*<font[^>]*>\s*(\d+)/i', $html, $mPuntos)) {
                    $puntos = intval($mPuntos[1]);
                }

                $tipoLicencia = null;
                if (preg_match('/Tipo\s*Licencia:\s*<\/b>\s*([^<]+)/i', $html, $mLic)) {
                    $tipoLicencia = trim($mLic[1]);
                }

                $valorPendiente = 0.00;
                if (preg_match('/Total\s*a\s*pagar:\s*<\/b>\s*\$?\s*([\d\.]+)/i', $html, $mValor)) {
                    $valorPendiente = floatval($mValor[1]);
                }

                // Solo devolvemos success SI realmente pudimos extraer los puntos o la licencia
                if ($puntos !== null || $tipoLicencia !== null) {
                    return response()->json([
                        'status' => 'success',
                        'datos' => [
                            'puntos' => $puntos,
                            'tipoLicencia' => $tipoLicencia,
                            'valorPendientePago' => $valorPendiente,
                            'totalMultas' => $valorPendiente > 0 ? 1 : 0
                        ]
                    ]);
                }
            }

            // Si no se encontraron los datos o el portal ANT no cargó la plantilla de citaciones
            return response()->json([
                'status' => 'warning',
                'message' => 'Servidor de la ANT no disponible temporalmente o no registra datos.',
                'datos' => null
            ], 503);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Servidor de la ANT no disponible temporalmente.',
                'datos' => null
            ], 503);
        }
    }
}
