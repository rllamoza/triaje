<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Atencion;
use App\Models\Triaje;
use App\Services\TriajeAlertService;
use Illuminate\Http\Request;

class TriajeController extends Controller
{
    public function __construct(private TriajeAlertService $alertService) {}

    public function store(Request $request)
    {
        $data = $request->validate([
            'atencion_id'            => 'required|exists:atenciones,id',
            'temperatura_c'          => 'nullable|numeric|between:30,45',
            'presion_sistolica'       => 'nullable|integer|between:50,250',
            'presion_diastolica'      => 'nullable|integer|between:30,150',
            'frecuencia_cardiaca'     => 'nullable|integer|between:20,250',
            'frecuencia_respiratoria' => 'nullable|integer|between:5,60',
            'saturacion_o2_pct'       => 'nullable|integer|between:50,100',
            'glucosa_mg_dl'           => 'nullable|integer|between:20,600',
            'peso_kg'                 => 'nullable|numeric',
            'talla_cm'                => 'nullable|numeric',
            'altitud_atencion_masl'   => 'nullable|integer',
            'prioridad'               => 'required|in:I,II,III',
            'prioridad_label'         => 'nullable|string',
            'prioridad_color'         => 'nullable|in:rojo,amarillo,verde',
            'sintoma_principal'       => 'nullable|string',
            'alergias_activas'        => 'nullable|array',
            'motivo_consulta'         => 'nullable|string',
            'observaciones_triaje'    => 'nullable|string',
            'enfermera_id'            => 'nullable|exists:users,id',
        ]);

        // IMC automático
        if (!empty($data['peso_kg']) && !empty($data['talla_cm'])) {
            $t = $data['talla_cm'] / 100;
            $data['imc'] = round($data['peso_kg'] / ($t * $t), 1);
        }

        // Corrección SpO2 por altitud
        if (!empty($data['saturacion_o2_pct']) && !empty($data['altitud_atencion_masl'])) {
            $data['saturacion_corregida'] = $data['saturacion_o2_pct'];
        }

        $triaje = Triaje::updateOrCreate(['atencion_id' => $data['atencion_id']], $data);

        // Cambiar estado de la atención
        $atencion = Atencion::find($data['atencion_id']);
        $atencion->update([
            'status'        => 'en_espera_medico',
            'triage_end_at' => now(),
        ]);

        $alerts = $this->alertService->evaluate($data, $data['altitud_atencion_masl'] ?? 0);

        return response()->json([
            'triaje'  => $triaje->load('enfermera'),
            'alerts'  => $alerts,
        ], 201);
    }

    public function showByAtencion(int $atencionId)
    {
        $triaje = Triaje::with('enfermera')->where('atencion_id', $atencionId)->firstOrFail();
        $alerts = $this->alertService->evaluate($triaje->toArray(), $triaje->altitud_atencion_masl ?? 0);
        return response()->json(['triaje' => $triaje, 'alerts' => $alerts]);
    }

    public function update(Request $request, Triaje $triaje)
    {
        $triaje->update($request->only([
            'temperatura_c','presion_sistolica','presion_diastolica',
            'frecuencia_cardiaca','frecuencia_respiratoria','saturacion_o2_pct',
            'glucosa_mg_dl','peso_kg','talla_cm',
            'prioridad','prioridad_label','prioridad_color',
            'sintoma_principal','alergias_activas','motivo_consulta','observaciones_triaje'
        ]));
        return response()->json($triaje);
    }

    public function rangos(Request $request)
    {
        $altitud = (int) $request->get('altitud_masl', 0);
        $spo2Min = $this->alertService->getSpo2Threshold($altitud);

        return response()->json([
            'temperatura_c'     => ['min' => 36.0, 'max' => 37.5, 'warning' => [37.5, 38.5], 'danger' => [38.5, null]],
            'presion_sistolica' => ['min' => 90, 'max' => 139, 'warning' => [140, 179], 'danger' => [180, null]],
            'presion_diastolica'=> ['min' => 60, 'max' => 89, 'warning' => [90, 109], 'danger' => [110, null]],
            'frecuencia_cardiaca'=> ['min' => 60, 'max' => 100],
            'frecuencia_respiratoria' => ['min' => 12, 'max' => 20],
            'saturacion_o2_pct' => ['min' => $spo2Min, 'max' => 100, 'altitud_masl' => $altitud],
            'glucosa_mg_dl'     => ['min' => 70, 'max' => 140, 'danger_low' => 70, 'danger_high' => 200],
        ]);
    }
}
