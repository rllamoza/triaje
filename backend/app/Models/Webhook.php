<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Webhook extends Model
{
    protected $table = 'webhooks';

    protected $fillable = [
        'name',
        'description',
        'type',
        'protocol',
        'url',
        'event',
        'auth_type',
        'auth_token',
        'secret',
        'headers',
        'status',
        'last_status_code',
        'last_latency_ms',
        'last_triggered_at',
        'last_error',
        'payload_sample',
        'is_enabled',
    ];

    protected $casts = [
        'headers'           => 'array',
        'payload_sample'    => 'array',
        'is_enabled'        => 'boolean',
        'last_triggered_at' => 'datetime',
        'last_status_code'  => 'integer',
        'last_latency_ms'   => 'integer',
    ];

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class, 'webhook_id')->latest();
    }
}
