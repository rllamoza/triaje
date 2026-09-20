<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Beneficiario;
use App\Services\RENIECService;
use Illuminate\Http\Request;

class BeneficiarioController extends Controller
{
    public function __construct(private RENIECService $reniec) {}

    public function reniecLookup(string $dni)
    {
        if (!preg_match('/^\d{8}$/', $dni)) {
            return response()->json(['message' => 'DNI debe tener 8 dígitos numéricos'], 422);
        }

        $raw = $this->reniec->lookup($dni);

        if (!$raw) {
            return response()->json(['message' => 'DNI no encontrado en RENIEC ni en Padrón Local', 'from_cache' => false], 404);
        }

        $mapped = $this->reniec->mapToForm($raw, $dni);

        return response()->json([
            'found'            => true,
            'from_cache'       => ($mapped['source'] ?? '') !== 'RENIEC Cloud Oficial',
            'source'           => $mapped['source'] ?? 'Padrón Comunitario',
            'data'             => $mapped,
            // Atributos directos en primer nivel para compatibilidad total con cualquier cliente:
            'dni'              => $mapped['dni'],
            'nombres'          => $mapped['nombres'],
            'apellido_paterno' => $mapped['apellido_paterno'],
            'apellido_materno' => $mapped['apellido_materno'],
            'apellidos'        => $mapped['apellidos'],
            'fecha_nacimiento' => $mapped['fecha_nacimiento'],
            'sexo'             => $mapped['sexo'],
            'comunidad'        => $mapped['comunidad'],
            'telefono'         => $mapped['telefono'],
            'direccion'        => $mapped['direccion'],
        ]);
    }

    public function checkDuplicate(string $dni, Request $request)
    {
        $campaignId = $request->campaign_id;
        $existing = Beneficiario::where('dni', $dni)
            ->when($campaignId, fn($q) => $q->whereHas('atenciones', fn($a) => $a->where('campaign_id', $campaignId)))
            ->first();

        return response()->json([
            'duplicate'     => !!$existing,
            'beneficiario'  => $existing ? $existing->only(['id','dni','nombres','apellidos']) : null,
        ]);
    }

    public function index(Request $request)
    {
        $q = Beneficiario::with('campaign')
            ->when($request->search, fn($q, $s) =>
                $q->where('dni', 'like', "%$s%")
                  ->orWhere('nombres', 'like', "%$s%")
                  ->orWhere('apellidos', 'like', "%$s%")
            )
            ->when($request->campaign_id, fn($q, $id) => $q->where('campaign_id', $id));

        return response()->json($q->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'dni'              => 'required|string|size:8',
            'nombres'          => 'required|string',
            'apellidos'        => 'required|string',
            'fecha_nacimiento' => 'required|date',
            'sexo'             => 'required|in:M,F,O',
            'estado_civil'     => 'nullable|string',
            'idioma_principal' => 'nullable|string',
            'region'           => 'nullable|string',
            'provincia'        => 'nullable|string',
            'distrito'         => 'nullable|string',
            'comunidad'        => 'nullable|string',
            'altitud_residencia'=> 'nullable|integer',
            'tipo_seguro'      => 'nullable|string',
            'numero_afiliacion'=> 'nullable|string',
            'celular'          => 'nullable|string',
            'grupo_sanguineo'  => 'nullable|string',
            'rh_factor'        => 'nullable|in:+,-',
            'peso_kg'          => 'nullable|numeric',
            'talla_cm'         => 'nullable|numeric',
            'reniec_verified'  => 'nullable|boolean',
            'campaign_id'      => 'required|exists:campaigns,id',
        ]);

        $data['registered_by'] = $request->user()->id;
        $data['edad_calculada'] = now()->diffInYears($data['fecha_nacimiento']);

        if (isset($data['peso_kg']) && isset($data['talla_cm']) && $data['talla_cm'] > 0) {
            $t = $data['talla_cm'] / 100;
            $data['imc'] = round($data['peso_kg'] / ($t * $t), 1);
        }

        $beneficiario = Beneficiario::updateOrCreate(['dni' => $data['dni']], $data);

        return response()->json($beneficiario, 201);
    }

    public function show(Beneficiario $beneficiario)
    {
        return response()->json($beneficiario->load(['campaign', 'atenciones.triaje', 'atenciones.consulta']));
    }

    public function historial(Beneficiario $beneficiario)
    {
        return response()->json(
            $beneficiario->atenciones()
                ->with(['campaign', 'triaje', 'consulta.medico', 'station'])
                ->orderByDesc('arrival_time')
                ->get()
        );
    }
}
