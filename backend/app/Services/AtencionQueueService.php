<?php
namespace App\Services;

use App\Models\Atencion;
use App\Models\Campaign;

class AtencionQueueService
{
    public function getQueue(Campaign $campaign): array
    {
        return Atencion::with(['beneficiario', 'triaje', 'station'])
            ->where('campaign_id', $campaign->id)
            ->whereDate('arrival_time', today())
            ->whereNotIn('status', ['finalizado', 'referido', 'no_se_presento'])
            ->orderByRaw("CASE
                WHEN status = 'en_consulta' THEN 1
                WHEN status = 'en_espera_medico' THEN 2
                WHEN status = 'en_triaje' THEN 3
                WHEN status = 'en_espera_triaje' THEN 4
                ELSE 5 END")
            ->orderByRaw("CASE
                WHEN triaje.prioridad = 'I' THEN 1
                WHEN triaje.prioridad = 'II' THEN 2
                ELSE 3 END")
            ->orderBy('arrival_time')
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'ticket'        => "T-{$a->ticket_number}",
                'nombre'        => $a->beneficiario->full_name,
                'dni'           => $a->beneficiario->dni,
                'edad'          => $a->beneficiario->edad,
                'sexo'          => $a->beneficiario->sexo,
                'status'        => $a->status,
                'prioridad'     => $a->triaje?->prioridad ?? 'III',
                'prioridad_color'=> $a->triaje?->prioridad_color ?? 'verde',
                'alergias'      => $a->triaje?->alergias_activas ?? [],
                'espera_minutos'=> $a->wait_minutes,
                'station'       => $a->station?->code,
                'seguro'        => $a->beneficiario->tipo_seguro,
            ])
            ->toArray();
    }

    public function nextTicketNumber(int $campaignId): int
    {
        $last = Atencion::where('campaign_id', $campaignId)
            ->whereDate('arrival_time', today())
            ->max('ticket_number');
        return ($last ?? 0) + 1;
    }
}
