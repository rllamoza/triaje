<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            User::when($request->role, fn($q, $r) => $q->where('role', $r))
                ->when($request->active !== null, fn($q) => $q->where('active', $request->boolean('active')))
                ->orderBy('apellidos')
                ->get(['id','name','apellidos','cmp_code','dni','role','station_default','active','last_login_at'])
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'           => 'required|string',
            'apellidos'      => 'nullable|string',
            'email'          => 'required|email|unique:users',
            'password'       => 'required|string|min:8',
            'cmp_code'       => 'nullable|string|unique:users',
            'dni'            => 'nullable|string|size:8',
            'role'           => 'required|in:admin,medico,triaje,admision,guardia',
            'pin'            => 'nullable|string|size:4',
            'station_default'=> 'nullable|string',
        ]);

        if (isset($data['pin'])) {
            $data['pin_hash'] = Hash::make($data['pin']);
            unset($data['pin']);
        }
        $data['password'] = Hash::make($data['password']);

        return response()->json(User::create($data), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->only(['id','name','apellidos','cmp_code','dni','role','station_default','active','last_login_at']));
    }

    public function update(Request $request, User $user)
    {
        $user->update($request->only(['name','apellidos','role','station_default','active','cmp_code']));
        return response()->json($user);
    }

    public function destroy(User $user)
    {
        $user->update(['active' => false]);
        return response()->json(['message' => 'Usuario desactivado']);
    }

    public function resetPin(Request $request, User $user)
    {
        $data = $request->validate(['pin' => 'required|string|size:4']);
        $user->update(['pin_hash' => Hash::make($data['pin'])]);
        return response()->json(['message' => 'PIN actualizado']);
    }
}
