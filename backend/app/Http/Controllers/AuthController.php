<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            // 1. Validar los campos de entrada
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // 2. Buscar al usuario por correo
            $user = User::where('email', $request->email)->first();

            // 3. Verificar si el usuario existe y la contraseña es correcta
            if (! $user || ! Hash::check($request->password, $user->password)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Las credenciales proporcionadas son incorrectas.'
                ], 401);
            }

            // 4. Generar el Token de API con Sanctum
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Inicio de sesión exitoso',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Error en AuthController@login: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Error interno en servidor Laravel: ' . $e->getMessage()
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
        } catch (\Exception $e) {
            //
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Sesión cerrada correctamente'
        ]);
    }
}
