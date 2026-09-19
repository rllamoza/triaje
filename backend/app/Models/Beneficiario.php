<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class Beneficiario extends Model
{
    use HasFactory;

    protected $fillable = [
        'dni','nombres','apellidos','fecha_nacimiento','sexo',
        'estado_civil','idioma_principal','grado_instruccion','ocupacion',
        'region','provincia','distrito','comunidad','direccion_libre','altitud_residencia',
        'tipo_seguro','numero_afiliacion','celular',
        'grupo_sanguineo','rh_factor','peso_kg','talla_cm',
        'reniec_verified','reniec_data_raw','registered_by','campaign_id'
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'reniec_verified'  => 'boolean',
        'reniec_data_raw'  => 'array',
        'peso_kg'          => 'decimal:2',
        'talla_cm'         => 'decimal:1',
    ];

    public function campaign()   { return $this->belongsTo(Campaign::class); }
    public function registeredBy(){ return $this->belongsTo(User::class, 'registered_by'); }
    public function atenciones() { return $this->hasMany(Atencion::class); }

    public function getEdadAttribute(): int {
        return Carbon::parse($this->fecha_nacimiento)->age;
    }

    public function getImcAttribute(): ?float {
        if (!$this->peso_kg || !$this->talla_cm) return null;
        $talla_m = $this->talla_cm / 100;
        return round($this->peso_kg / ($talla_m * $talla_m), 1);
    }

    public function getFullNameAttribute(): string {
        return $this->apellidos . ', ' . $this->nombres;
    }
}
