<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consulta extends Model
{
    protected $fillable = [
        'atencion_id','medico_id','motivo_consulta','enfermedad_actual',
        'antecedentes_personales','antecedentes_familiares',
        'examen_fisico','diagnosticos','plan_tratamiento','indicaciones',
        'receta','examenes_solicitados',
        'requiere_referencia','referencia_destino','referencia_urgencia',
        'signature_hash','signed_at'
    ];

    protected $casts = [
        'examen_fisico'         => 'array',
        'diagnosticos'          => 'array',
        'receta'                => 'array',
        'examenes_solicitados'  => 'array',
        'requiere_referencia'   => 'boolean',
        'signed_at'             => 'datetime',
    ];

    public function atencion() { return $this->belongsTo(Atencion::class); }
    public function medico()   { return $this->belongsTo(User::class, 'medico_id'); }
}
