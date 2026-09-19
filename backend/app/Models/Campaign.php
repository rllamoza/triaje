<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'code','name','location_name','province','department',
        'altitude_masl','start_date','end_date','status',
        'node_id','starlink_active','notes','created_by'
    ];

    protected $casts = [
        'start_date'      => 'date',
        'end_date'        => 'date',
        'starlink_active' => 'boolean',
    ];

    public function stations()     { return $this->hasMany(Station::class); }
    public function users()        { return $this->belongsToMany(User::class, 'campaign_users'); }
    public function beneficiarios(){ return $this->hasMany(Beneficiario::class); }
    public function atenciones()   { return $this->hasMany(Atencion::class); }
    public function creator()      { return $this->belongsTo(User::class, 'created_by'); }

    public function getTodayCountAttribute(): int {
        return $this->atenciones()->whereDate('arrival_time', today())->count();
    }
}
