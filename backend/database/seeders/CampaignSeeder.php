<?php
namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Station;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        $campaign = Campaign::updateOrCreate(['code'=>'CMP-2025-CUS-02'],[
            'name'=>'Cusco - Valle Sagrado 2025','location_name'=>'Salon Comunal Rumichaca',
            'province'=>'Urubamba','department'=>'Cusco','altitude_masl'=>2870,
            'start_date'=>'2025-04-01','status'=>'active','node_id'=>'CUS-VALLE-04','starlink_active'=>true,
        ]);
        $stations=[
            ['code'=>'ADM-01','type'=>'admision','label'=>'Mesa Admision 01','printer_id'=>'BT-POS-01'],
            ['code'=>'TRI-02','type'=>'triaje','label'=>'Box Triaje B-02','printer_id'=>null],
            ['code'=>'MED-01','type'=>'medico','label'=>'Consultorio 1','printer_id'=>'BT-POS-01'],
            ['code'=>'PED-02','type'=>'pediatria','label'=>'Consultorio 2 - Pediatria','printer_id'=>null],
        ];
        foreach ($stations as $st) {
            Station::updateOrCreate(['campaign_id'=>$campaign->id,'code'=>$st['code']],array_merge($st,['campaign_id'=>$campaign->id,'active'=>true]));
        }
    }
}