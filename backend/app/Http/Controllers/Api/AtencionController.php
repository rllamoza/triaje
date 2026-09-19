<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Atencion;
use App\Models\Campaign;
use App\Services\AtencionQueueService;
use Illuminate\Http\Request;

class AtencionController extends Controller
{
    public function __construct(private AtencionQueueService $queue) {}

    public function index(Request $request)
    {
        $q = Atencion::with(['beneficiario', 'triaje', 'station', 'admittedBy'])
            ->when($request->campaign_id, fn($q, $id) => $q->where('campaign_id', $id))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->date, fn($q, $d) => $q->whereDate('arrival_time', $d))
            ->orderByDesc('arrival_time');

        return response()->json($q->paginate(30));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'beneficiario_id' => 'required|exists:beneficiarios,id',
            'campaign_id'     => 'required|exists:campaigns,id',
            'station_id'      => 'nullable|exists:stations,id',
            'seguro_usado'    => 'nullable|string',
        ]);

        $data['ticket_number'] = $this->queue->nextTicketNumber($data['campaign_id']);
        $data['arrival_time']  = now();
        $data['status']        = 'admitido';
        $data['admitted_by']   = $request->user()->id;

        $atencion = Atencion::create($data);

        return response()->json($atencion->load(['beneficiario', 'campaign', 'station']), 201);
    }

    public function show(Atencion $atencion)
    {
        return response()->json(
            $atencion->load(['beneficiario', 'campaign', 'station', 'triaje.enfermera', 'consulta.medico', 'tickets'])
        );
    }

    public function updateStatus(Request $request, Atencion $atencion)
    {
        $data = $request->validate([
            'status'     => 'required|in:admitido,en_espera_triaje,en_triaje,en_espera_medico,en_consulta,en_farmacia,finalizado,referido,no_se_presento',
            'station_id' => 'nullable|exists:stations,id',
        ]);

        $now = now();
        $updates = ['status' => $data['status']];

        match ($data['status']) {
            'en_triaje'       => $updates['triage_start_at'] = $now,
            'en_espera_medico'=> $updates['triage_end_at'] = $now,
            'en_consulta'     => $updates['medico_start_at'] = $now,
            'finalizado', 'referido' => $updates['medico_end_at'] = $now,
            default           => null,
        };

        if ($data['station_id'] ?? null) $updates['station_id'] = $data['station_id'];
        $atencion->update($updates);

        return response()->json($atencion->fresh(['beneficiario', 'triaje', 'station']));
    }

    public function cola(Campaign $campaign)
    {
        return response()->json([
            'queue'     => $this->queue->getQueue($campaign),
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function colaLive(Campaign $campaign)
    {
        // Server-Sent Events
        return response()->stream(function () use ($campaign) {
            while (true) {
                $data = json_encode($this->queue->getQueue($campaign));
                echo "data: {$data}\n\n";
                ob_flush();
                flush();
                sleep(10);
                if (connection_aborted()) break;
            }
        }, 200, [
            'Content-Type'  => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
