<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Atencion extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number','beneficiario_id','campaign_id','station_id',
        'arrival_time','status','seguro_usado',
        'triage_start_at','triage_end_at','medico_start_at','medico_end_at',
        'referred_to','notes','admitted_by'
    ];

    protected $casts = [
        'arrival_time'   => 'datetime',
        'triage_start_at'=> 'datetime',
        'triage_end_at'  => 'datetime',
        'medico_start_at'=> 'datetime',
        'medico_end_at'  => 'datetime',
    ];

    public function beneficiario() { return $this->belongsTo(Beneficiario::class); }
    public function campaign()     { return $this->belongsTo(Campaign::class); }
    public function station()      { return $this->belongsTo(Station::class); }
    public function admittedBy()   { return $this->belongsTo(User::class, 'admitted_by'); }
    public function triaje()       { return $this->hasOne(Triaje::class); }
    public function consulta()     { return $this->hasOne(Consulta::class); }
    public function tickets()      { return $this->hasMany(TicketTermico::class); }

    public function getWaitMinutesAttribute(): int {
        return now()->diffInMinutes($this->arrival_time);
    }
}
