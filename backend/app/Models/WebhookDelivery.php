<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    protected $table = 'webhook_deliveries';

    protected $fillable = [
        'webhook_id',
        'event',
        'url',
        'request_headers',
        'request_payload',
        'response_status',
        'response_headers',
        'response_body',
        'duration_ms',
        'status',
        'error_message',
    ];

    protected $casts = [
        'request_headers'  => 'array',
        'request_payload'  => 'array',
        'response_headers' => 'array',
        'response_status'  => 'integer',
        'duration_ms'      => 'integer',
    ];

    public function webhook(): BelongsTo
    {
        return $this->belongsTo(Webhook::class, 'webhook_id');
    }
}
