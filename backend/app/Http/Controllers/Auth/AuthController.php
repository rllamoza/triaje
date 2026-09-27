<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RENIECService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'credential' => 'required|string',
            'password'   => 'required|string',
            'role'       => 'nullable|string',
            'campaign_id'=> 'nullable|integer',
            'station_id' => 'nullable|string',
        ]);

        $user = User::where('cmp_code', $request->credential)
            ->orWhere('dni', $request->credential)
            ->orWhere('email', $request->credential)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        // Si el usuario no ha verificado su correo
        if (!$user->active && empty($user->email_verified_at)) {
            return response()->json([
                'message' => 'Debe verificar su correo electrónico con el código de 6 dígitos antes de iniciar sesión.',
                'requires_verification' => true,
                'email' => $user->email,
            ], 403);
        }

        if (!$user->active) {
            return response()->json(['message' => 'Cuenta de usuario inactiva o suspendida.'], 403);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('semilla-session', ['*'], now()->addHours(8));

        return response()->json([
            'token'      => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at,
            'user'       => [
                'id'          => $user->id,
                'nombres'     => $user->name,
                'apellidos'   => $user->apellidos,
                'full_name'   => $user->full_name,
                'cmp_code'    => $user->cmp_code,
                'dni'         => $user->dni,
                'role'        => $user->role,
                'station_default' => $request->station_id ?? $user->station_default,
            ],
            'campaign_id' => $request->campaign_id,
            'station_id'  => $request->station_id ?? $user->station_default,
        ]);
    }

    public function loginPin(Request $request)
    {
        $request->validate([
            'pin'          => 'required|string|size:4',
            'responsable'  => 'required|string',
            'campaign_id'  => 'nullable|integer',
        ]);

        $user = User::where('active', true)
            ->whereNotNull('pin_hash')
            ->get()
            ->first(fn($u) => Hash::check($request->pin, $u->pin_hash));

        if (!$user) {
            return response()->json(['message' => 'PIN inválido'], 401);
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('semilla-pin', ['*'], now()->addHours(4));

        return response()->json([
            'token'      => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at,
            'user'       => [
                'id'      => $user->id,
                'full_name'=> $user->full_name,
                'role'    => 'guardia',
            ],
            'mode' => 'pin_emergencia',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id'             => $user->id,
            'nombres'        => $user->name,
            'apellidos'      => $user->apellidos,
            'full_name'      => $user->full_name,
            'cmp_code'       => $user->cmp_code,
            'dni'            => $user->dni,
            'role'           => $user->role,
            'station_default'=> $user->station_default,
            'active'         => $user->active,
            'last_login_at'  => $user->last_login_at,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function nodeStatus()
    {
        $pendingSyncCount = 0;
        try {
            if (Schema::hasTable('sync_logs')) {
                $pendingSyncCount = DB::table('sync_logs')->where('synced', false)->count();
            }
        } catch (\Throwable $e) {
            $pendingSyncCount = 0;
        }

        return response()->json([
            'node_id'            => env('NODE_ID', config('app.node_id', 'CUS-VALLE-04')),
            'hardware'           => env('NODE_HARDWARE', 'Minisforum Edge Core v4.2'),
            'starlink'           => true,
            'latency_ms'         => rand(32, 45),
            'battery_pct'        => 94,
            'printer'            => 'BT-POS-01',
            'printer_ok'         => true,
            'db_synced'          => $pendingSyncCount === 0,
            'pending_sync_count' => $pendingSyncCount,
            'timezone'           => config('app.timezone', 'UTC-5'),
            'timestamp'          => now()->toISOString(),
        ]);
    }

    /**
     * Registro de nuevo voluntario para la campaña médica con todos sus roles.
     */
    public function registerVolunteer(Request $request, \App\Services\BrevoService $brevoService)
    {
        $data = $request->validate([
            'name'            => 'required|string|max:100',
            'apellidos'       => 'required|string|max:100',
            'email'           => 'required|email|max:150|unique:users,email',
            'password'        => 'required|string|min:6',
            'role'            => 'required|string|in:medico,triaje,admision,farmacia,guardia,coordinador,voluntario',
            'dni'             => 'nullable|string|max:15',
            'telefono'        => 'nullable|string|max:20',
            'cmp_code'        => 'nullable|string|max:30',
            'especialidad'    => 'nullable|string|max:100',
            'station_default' => 'nullable|string|max:20',
        ]);

        // Generar código de verificación de 6 dígitos criptográficamente seguro
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        // Estación por defecto sugerida según el rol si no se especificó
        $stationDefault = $data['station_default'] ?? null;
        if (!$stationDefault) {
            $stationMap = [
                'medico'      => 'MED-01',
                'triaje'      => 'TRI-01',
                'admision'    => 'ADM-01',
                'farmacia'    => 'FAR-01',
                'guardia'     => 'ENT-01',
                'coordinador' => 'ADM-01',
                'voluntario'  => 'GEN-01',
            ];
            $stationDefault = $stationMap[$data['role']] ?? 'ADM-01';
        }

        $user = User::create([
            'name'                          => trim($data['name']),
            'apellidos'                     => trim($data['apellidos']),
            'email'                         => strtolower(trim($data['email'])),
            'password'                      => Hash::make($data['password']),
            'role'                          => $data['role'],
            'dni'                           => !empty($data['dni']) ? trim($data['dni']) : null,
            'cmp_code'                      => !empty($data['cmp_code']) ? trim($data['cmp_code']) : null,
            'telefono'                      => !empty($data['telefono']) ? trim($data['telefono']) : null,
            'especialidad'                  => !empty($data['especialidad']) ? trim($data['especialidad']) : null,
            'station_default'               => $stationDefault,
            'email_verification_code'       => $code,
            'email_verification_expires_at' => now()->addMinutes(15),
            'email_verification_attempts'   => 0,
            'active'                        => false, // Se activa al verificar el correo
        ]);

        // Enviar correo transaccional vía Brevo
        $mailResult = $brevoService->sendVerificationCode(
            $user->email,
            $user->full_name,
            $code
        );

        return response()->json([
            'message'             => 'Registro exitoso. Se ha enviado un código de 6 dígitos a su correo electrónico.',
            'email'               => $user->email,
            'expires_in_minutes'  => 15,
            'brevo_status'        => $mailResult,
        ], 201);
    }

    /**
     * Verificar código de 6 dígitos e iniciar sesión automáticamente.
     */
    public function verifyEmailCode(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $email = strtolower(trim($request->email));
        $code = trim($request->code);

        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado con ese correo.'], 404);
        }

        if (!empty($user->email_verified_at)) {
            return response()->json([
                'message' => 'Este correo ya ha sido verificado previamente. Ya puede iniciar sesión.',
                'already_verified' => true,
            ]);
        }

        // Validar intentos fallidos de fuerza bruta
        if ($user->email_verification_attempts >= 5) {
            return response()->json([
                'message' => 'Ha superado el número máximo de intentos permitidos (5). Solicite un nuevo código.',
            ], 429);
        }

        // Validar si el código ha expirado
        if (!$user->email_verification_expires_at || now()->greaterThan($user->email_verification_expires_at)) {
            return response()->json([
                'message' => 'El código de verificación ha expirado. Por favor solicite un nuevo código.',
                'expired' => true,
            ], 400);
        }

        // Comparar código
        if ($user->email_verification_code !== $code) {
            $user->increment('email_verification_attempts');
            $remaining = 5 - $user->email_verification_attempts;
            return response()->json([
                'message' => "Código de verificación incorrecto. Intentos restantes: {$remaining}.",
                'remaining_attempts' => $remaining,
            ], 400);
        }

        // Código correcto: activar usuario y marcar verificado
        $user->update([
            'email_verified_at'             => now(),
            'active'                        => true,
            'email_verification_code'       => null,
            'email_verification_expires_at' => null,
            'email_verification_attempts'   => 0,
            'last_login_at'                 => now(),
        ]);

        // Crear token de sesión Sanctum
        $token = $user->createToken('semilla-session', ['*'], now()->addHours(8));

        return response()->json([
            'message'    => '¡Correo verificado con éxito! Cuenta activada.',
            'token'      => $token->plainTextToken,
            'expires_at' => $token->accessToken->expires_at,
            'user'       => [
                'id'              => $user->id,
                'nombres'         => $user->name,
                'apellidos'       => $user->apellidos,
                'full_name'       => $user->full_name,
                'cmp_code'        => $user->cmp_code,
                'dni'             => $user->dni,
                'role'            => $user->role,
                'station_default' => $user->station_default,
                'active'          => $user->active,
            ],
            'station_id' => $user->station_default,
        ]);
    }

    /**
     * Reenviar nuevo código de verificación de 6 dígitos.
     */
    public function resendVerificationCode(Request $request, \App\Services\BrevoService $brevoService)
    {
        $request->validate(['email' => 'required|email']);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['message' => 'No se encontró ninguna cuenta con ese correo.'], 404);
        }

        if (!empty($user->email_verified_at)) {
            return response()->json([
                'message' => 'Esta cuenta ya está verificada. Puede iniciar sesión directamente.',
                'already_verified' => true,
            ]);
        }

        // Generar nuevo código
        $code = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'email_verification_code'       => $code,
            'email_verification_expires_at' => now()->addMinutes(15),
            'email_verification_attempts'   => 0,
        ]);

        $mailResult = $brevoService->sendVerificationCode(
            $user->email,
            $user->full_name,
            $code
        );

        return response()->json([
            'message'            => 'Nuevo código de verificación enviado al correo.',
            'email'              => $user->email,
            'expires_in_minutes' => 15,
            'brevo_status'       => $mailResult,
        ]);
    }

    /**
     * Endpoint para probar la integración con Brevo.
     */
    public function testBrevo(Request $request, \App\Services\BrevoService $brevoService)
    {
        $request->validate(['email' => 'required|email']);
        $result = $brevoService->sendTestEmail($request->email);

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}

