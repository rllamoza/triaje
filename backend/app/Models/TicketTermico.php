<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketTermico extends Model
{
    protected $fillable = [
        'atencion_id','tipo','printer_id','contenido_raw',
        'escpos_base64','qr_code','printed_at','printed_by','bt_device_name'
    ];
    protected $casts = ['printed_at' => 'datetime'];
    public function atencion()  { return $this->belongsTo(Atencion::class); }
    public function printedBy() { return $this->belongsTo(User::class, 'printed_by'); }
}
