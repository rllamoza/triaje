<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicamento extends Model
{
    protected $fillable = [
        'nombre_generico','nombre_comercial','concentracion',
        'forma_farmaceutica','via_administracion',
        'stock_actual','stock_minimo','activo'
    ];

    protected $casts = ['activo' => 'boolean'];

    public function scopeActivos($q)  { return $q->where('activo', true); }
    public function scopeSearch($q, $term) {
        return $q->where(fn($s) =>
            $s->where('nombre_generico', 'like', "%$term%")
              ->orWhere('nombre_comercial', 'like', "%$term%")
        );
    }
}
