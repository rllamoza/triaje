<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Triaje extends Model
{
    protected $fillable = [
        'atencion_id','temperatura_c','presion_sistolica','presion_diastolica',
        'frecuencia_cardiaca','frecuencia_respiratoria','saturacion_o2_pct',
        'glucosa_mg_dl','peso_kg','talla_cm','imc',
        'altitud_atencion_masl','saturacion_corregida',
        'prioridad','prioridad_label','prioridad_color',
        'sintoma_principal','alergias_activas','alertas_clinicas',
        'motivo_consulta','observaciones_triaje','enfermera_id'
    ];

    protected $casts = [
        'alergias_activas' => 'array',
        'alertas_clinicas' => 'array',
        'temperatura_c'    => 'decimal:1',
        'peso_kg'          => 'decimal:2',
        'talla_cm'         => 'decimal:1',
        'imc'              => 'decimal:1',
    ];

    public function atencion()  { return $this->belongsTo(Atencion::class); }
    public function enfermera() { return $this->belongsTo(User::class, 'enfermera_id'); }
}
