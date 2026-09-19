<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    protected $fillable = ['campaign_id','code','type','label','printer_id','active'];
    protected $casts = ['active' => 'boolean'];
    public function campaign() { return $this->belongsTo(Campaign::class); }
    public function atenciones() { return $this->hasMany(Atencion::class); }
}
