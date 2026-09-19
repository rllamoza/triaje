<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Station;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(Request $request)
    {
        $q = Campaign::with(['stations', 'creator'])
            ->orderByRaw("CASE status WHEN 'active' THEN 1 WHEN 'planned' THEN 2 ELSE 3 END");

        if ($request->status) $q->where('status', $request->status);

        return response()->json($q->get()->map(fn($c) => [
            'id'           => $c->id,
            'code'         => $c->code,
            'name'         => $c->name,
            'location_name'=> $c->location_name,
            'province'     => $c->province,
            'department'   => $c->department,
            'altitude_masl'=> $c->altitude_masl,
            'start_date'   => $c->start_date,
            'end_date'     => $c->end_date,
            'status'       => $c->status,
            'node_id'      => $c->node_id,
            'starlink_active'=> $c->starlink_active,
            'today_count'  => $c->today_count,
            'stations_count'=> $c->stations->count(),
        ]));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code'         => 'required|string|max:20|unique:campaigns',
            'name'         => 'required|string|max:200',
            'location_name'=> 'required|string|max:200',
            'province'     => 'nullable|string',
            'department'   => 'nullable|string',
            'altitude_masl'=> 'nullable|integer',
            'start_date'   => 'required|date',
            'end_date'     => 'nullable|date|after:start_date',
            'status'       => 'in:planned,active,closed',
            'node_id'      => 'nullable|string',
        ]);
        $data['created_by'] = $request->user()->id;
        $campaign = Campaign::create($data);
        return response()->json($campaign, 201);
    }

    public function show(Campaign $campaign)
    {
        return response()->json($campaign->load(['stations', 'creator']));
    }

    public function update(Request $request, Campaign $campaign)
    {
        $campaign->update($request->only([
            'name','location_name','province','department','altitude_masl',
            'start_date','end_date','status','node_id','starlink_active','notes'
        ]));
        return response()->json($campaign);
    }

    public function activate(Campaign $campaign)
    {
        Campaign::where('status', 'active')->update(['status' => 'planned']);
        $campaign->update(['status' => 'active']);
        return response()->json(['message' => 'Campaña activada', 'campaign' => $campaign]);
    }

    public function close(Campaign $campaign)
    {
        $campaign->update(['status' => 'closed', 'end_date' => today()]);
        return response()->json(['message' => 'Campaña cerrada']);
    }

    public function stats(Campaign $campaign)
    {
        $atenciones = $campaign->atenciones()->whereDate('arrival_time', today());
        return response()->json([
            'total_hoy'     => $atenciones->count(),
            'finalizados'   => $atenciones->where('status', 'finalizado')->count(),
            'en_espera'     => $atenciones->whereIn('status', ['admitido','en_espera_triaje','en_espera_medico'])->count(),
            'referidos'     => $atenciones->where('status', 'referido')->count(),
            'rojo'          => $atenciones->whereHas('triaje', fn($q) => $q->where('prioridad', 'I'))->count(),
            'amarillo'      => $atenciones->whereHas('triaje', fn($q) => $q->where('prioridad', 'II'))->count(),
            'verde'         => $atenciones->whereHas('triaje', fn($q) => $q->where('prioridad', 'III'))->count(),
        ]);
    }

    public function stations(Campaign $campaign)
    {
        return response()->json($campaign->stations()->where('active', true)->get());
    }

    public function storeStation(Request $request, Campaign $campaign)
    {
        $data = $request->validate([
            'code'       => 'required|string|max:20',
            'type'       => 'required|in:admision,triaje,medico,farmacia,pediatria,otro',
            'label'      => 'required|string|max:100',
            'printer_id' => 'nullable|string',
        ]);
        $data['campaign_id'] = $campaign->id;
        return response()->json(Station::create($data), 201);
    }
}
