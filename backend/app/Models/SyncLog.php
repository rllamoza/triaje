<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncLog extends Model
{
    protected $table = 'sync_logs';

    protected $fillable = [
        'node_id',
        'entity_type',
        'entity_id',
        'operation',
        'payload',
        'synced',
        'synced_at',
        'conflict',
        'conflict_notes',
    ];

    protected $casts = [
        'payload'   => 'array',
        'synced'    => 'boolean',
        'synced_at' => 'datetime',
        'conflict'  => 'boolean',
    ];
}
