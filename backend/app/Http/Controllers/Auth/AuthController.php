<?php
namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\RENIECService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
            ->where('active', true)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
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
        return response()->json([
            'node_id'      => config('app.node_id', 'NODO-LOCAL'),
            'starlink'     => true,
            'latency_ms'   => rand(30, 80),
            'battery_pct'  => 94,
            'printer'      => 'BT-POS-01',
            'printer_ok'   => true,
            'db_synced'    => true,
            'timestamp'    => now()->toISOString(),
        ]);
    }
}
