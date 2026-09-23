<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditRecord extends Model
{
    /**
     * Dedicated Audit Database Connection
     */
    protected $connection = 'audi_triaje';

    protected $table = 'audit_records';

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'user_role',
        'user_dni',
        'station',
        'method',
        'url',
        'endpoint',
        'route_name',
        'action_category',
        'status_code',
        'duration_ms',
        'ip_address',
        'is_local_ip',
        'hostname',
        'network_effective_type',
        'network_rtt_ms',
        'network_downlink_mbps',
        'network_save_data',
        'device_type',
        'device_os',
        'device_browser',
        'screen_resolution',
        'client_timezone',
        'client_language',
        'user_agent',
        'request_payload',
        'response_summary',
        'error_message',
        'created_at',
    ];

    protected $casts = [
        'is_local_ip' => 'boolean',
        'network_save_data' => 'boolean',
        'duration_ms' => 'float',
        'network_downlink_mbps' => 'float',
        'network_rtt_ms' => 'integer',
        'status_code' => 'integer',
        'request_payload' => 'array',
        'response_summary' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
