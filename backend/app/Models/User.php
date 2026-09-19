<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name','apellidos','email','password','cmp_code','dni',
        'role','pin_hash','biometric_hash','token_fisico',
        'station_default','active','last_login_at'
    ];

    protected $hidden = ['password','pin_hash','biometric_hash','remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at'     => 'datetime',
        'active'            => 'boolean',
        'password'          => 'hashed',
    ];

    public function campaigns() { return $this->belongsToMany(Campaign::class, 'campaign_users'); }
    public function atenciones() { return $this->hasMany(Atencion::class, 'admitted_by'); }
    public function consultas()  { return $this->hasMany(Consulta::class, 'medico_id'); }
    public function triajes()    { return $this->hasMany(Triaje::class, 'enfermera_id'); }

    public function getFullNameAttribute(): string {
        return trim($this->name . ' ' . $this->apellidos);
    }
}
