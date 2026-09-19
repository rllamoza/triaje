<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use App\Models\Atencion;
use App\Models\Medicamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ConsultaController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'atencion_id'           => 'required|exists:atenciones,id',
            'medico_id'             => 'required|exists:users,id',
            'motivo_consulta'       => 'nullable|string',
            'enfermedad_actual'     => 'nullable|string',
            'antecedentes_personales'=> 'nullable|string',
            'antecedentes_familiares'=> 'nullable|string',
            'examen_fisico'         => 'nullable|array',
            'diagnosticos'          => 'nullable|array',
            'plan_tratamiento'      => 'nullable|string',
            'indicaciones'          => 'nullable|string',
            'receta'                => 'nullable|array',
            'examenes_solicitados'  => 'nullable|array',
            'requiere_referencia'   => 'nullable|boolean',
            'referencia_destino'    => 'nullable|string',
            'referencia_urgencia'   => 'nullable|in:normal,urgente,emergencia',
        ]);

        $consulta = Consulta::updateOrCreate(['atencion_id' => $data['atencion_id']], $data);

        Atencion::find($data['atencion_id'])->update(['status' => 'en_consulta', 'medico_start_at' => now()]);

        return response()->json($consulta->load('medico'), 201);
    }

    public function showByAtencion(int $atencionId)
    {
        return response()->json(
            Consulta::with(['medico', 'atencion.beneficiario', 'atencion.triaje'])
                ->where('atencion_id', $atencionId)
                ->firstOrFail()
        );
    }

    public function update(Request $request, Consulta $consulta)
    {
        if ($consulta->signed_at) {
            return response()->json(['message' => 'Consulta ya firmada, no puede modificarse'], 403);
        }
        $consulta->update($request->only([
            'motivo_consulta','enfermedad_actual','antecedentes_personales',
            'antecedentes_familiares','examen_fisico','diagnosticos',
            'plan_tratamiento','indicaciones','receta',
            'examenes_solicitados','requiere_referencia',
            'referencia_destino','referencia_urgencia'
        ]));
        return response()->json($consulta);
    }

    public function firmar(Consulta $consulta, Request $request)
    {
        if ($consulta->signed_at) {
            return response()->json(['message' => 'Ya fue firmada'], 409);
        }
        $payload   = $consulta->id . '|' . $request->user()->id . '|' . now()->toISOString();
        $signature = hash_hmac('sha256', $payload, config('app.key'));

        $consulta->update([
            'signature_hash' => $signature,
            'signed_at'      => now(),
        ]);

        $consulta->atencion->update([
            'status'       => $consulta->requiere_referencia ? 'referido' : 'finalizado',
            'medico_end_at'=> now(),
            'referred_to'  => $consulta->referencia_destino,
        ]);

        return response()->json([
            'message'        => 'Consulta firmada y cerrada',
            'signature_hash' => $signature,
            'signed_at'      => $consulta->signed_at,
        ]);
    }

    public function medicamentos(Request $request)
    {
        $q = Medicamento::activos()
            ->when($request->q, fn($q, $s) => $q->search($s))
            ->limit(20)
            ->get(['id','nombre_generico','nombre_comercial','concentracion','forma_farmaceutica','via_administracion']);

        return response()->json($q);
    }
}
