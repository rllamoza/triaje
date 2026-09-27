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
        'name','apellidos','email','password','cmp_code','dni','telefono','especialidad',
        'role','pin_hash','biometric_hash','token_fisico',
        'station_default','active','last_login_at',
        'email_verification_code','email_verification_expires_at','email_verification_attempts',
        'email_verified_at'
    ];

    protected $hidden = [
        'password','pin_hash','biometric_hash','remember_token',
        'email_verification_code'
    ];

    protected $casts = [
        'email_verified_at'             => 'datetime',
        'email_verification_expires_at' => 'datetime',
        'email_verification_attempts'   => 'integer',
        'last_login_at'                 => 'datetime',
        'active'                        => 'boolean',
        'password'                      => 'hashed',
    ];

    public function campaigns() { return $this->belongsToMany(Campaign::class, 'campaign_users'); }
    public function atenciones() { return $this->hasMany(Atencion::class, 'admitted_by'); }
    public function consultas()  { return $this->hasMany(Consulta::class, 'medico_id'); }
    public function triajes()    { return $this->hasMany(Triaje::class, 'enfermera_id'); }

    public function getFullNameAttribute(): string {
        return trim($this->name . ' ' . $this->apellidos);
    }
}
