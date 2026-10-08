<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Webhook;

class WebhookSeeder extends Seeder
{
    public function run(): void
    {
        $endpoints = [
            [
                'name'             => 'RENIEC - Consulta DNI v2',
                'description'      => 'Validación de identidad biométrica y padrón civil en línea o caché local',
                'type'             => 'rest_client',
                'protocol'         => 'REST JSON Client',
                'url'              => 'https://api.reniec.gob.pe/v2/dni',
                'event'            => 'on_patient_lookup',
                'auth_type'        => 'bearer_token',
                'auth_token'       => 'rn_live_948293710492817409284',
                'secret'           => null,
                'headers'          => ['Accept' => 'application/json', 'X-Institution-Id' => 'SEMILLA-PERU-2026'],
                'status'           => 'active',
                'last_status_code' => 200,
                'last_latency_ms'  => 340,
                'last_triggered_at'=> now()->subMinutes(8),
                'payload_sample'   => ['dni' => '45892301', 'query_source' => 'ADM-01', 'offline_fallback' => true],
                'is_enabled'       => true,
            ],
            [
                'name'             => 'MINSA / SIS - Acreditación de Cobertura',
                'description'      => 'Verificación plan subsidiado integral Fissal y afiliación activa',
                'type'             => 'rest_client',
                'protocol'         => 'REST JSON Client',
                'url'              => 'https://ws.sis.gob.pe/afiliacion',
                'event'            => 'on_patient_registered',
                'auth_type'        => 'mtls',
                'auth_token'       => null,
                'secret'           => 'SIS-2024-CUSCO-MTLS',
                'headers'          => ['Accept' => 'application/json', 'X-Region' => 'Cusco-Urubamba'],
                'status'           => 'degraded',
                'last_status_code' => 200,
                'last_latency_ms'  => 520,
                'last_triggered_at'=> now()->subMinutes(18),
                'payload_sample'   => ['tipo_doc' => '1', 'numero_doc' => '45892301', 'disa' => 'CUSCO'],
                'is_enabled'       => true,
            ],
            [
                'name'             => 'DIRESA Cusco - Exportación HIS Epidemiológica',
                'description'      => 'Reporte estadístico diario CIE-10 para red de salud y posta cabecera',
                'type'             => 'outgoing_webhook',
                'protocol'         => 'Webhook Saliente (HMAC)',
                'url'              => 'https://diresacusco.gob.pe/api/v1/campanas/his',
                'event'            => 'on_patient_consultation_closed',
                'auth_type'        => 'hmac_sha256',
                'auth_token'       => null,
                'secret'           => 'sec_wh_diresa_8923478912',
                'headers'          => ['Content-Type' => 'application/json', 'X-Campaign-Node' => 'CUS-VALLE-04'],
                'status'           => 'queued',
                'last_status_code' => 200,
                'last_latency_ms'  => 185,
                'last_triggered_at'=> now()->subMinutes(25),
                'payload_sample'   => [
                    'event' => 'on_patient_consultation_closed',
                    'paciente' => 'Mamani Quispe, Rosa',
                    'cie10' => ['J00' => 'Rinofaringitis aguda', 'I10' => 'Hipertensión esencial'],
                    'triaje' => ['pa_sistolica' => 125, 'pa_diastolica' => 82, 'spo2' => 94],
                ],
                'is_enabled'       => true,
            ],
            [
                'name'             => 'Almacén Farmacia Regional - Alerta Stock Crítico',
                'description'      => 'Notificación y reposición automática de antibióticos pediátricos y analgésicos',
                'type'             => 'outgoing_webhook',
                'protocol'         => 'Webhook Saliente (JSON)',
                'url'              => 'https://botiquin.semilla.org.pe/hooks/stock',
                'event'            => 'on_medication_low_stock',
                'auth_type'        => 'bearer_token',
                'auth_token'       => 'pharm_tok_44910294812',
                'secret'           => null,
                'headers'          => ['Content-Type' => 'application/json'],
                'status'           => 'active',
                'last_status_code' => 200,
                'last_latency_ms'  => 142,
                'last_triggered_at'=> now()->subMinutes(42),
                'payload_sample'   => [
                    'medicamento' => 'Amoxicilina 250mg/5ml Suspensión',
                    'stock_actual' => 3,
                    'umbral_critico' => 5,
                    'campaña' => 'Cusco - Valle Sagrado 2025',
                ],
                'is_enabled'       => true,
            ],
            [
                'name'             => 'Brevo / Alertas Transaccionales de Voluntariado',
                'description'      => 'Envío de códigos PIN de guardia, credenciales y reportes por email',
                'type'             => 'rest_client',
                'protocol'         => 'REST API Brevo v3',
                'url'              => 'https://api.brevo.com/v3/smtp/email',
                'event'            => 'on_volunteer_registered',
                'auth_type'        => 'bearer_token',
                'auth_token'       => env('BREVO_API_KEY', 'xkeysib-demo'),
                'secret'           => null,
                'headers'          => ['Content-Type' => 'application/json', 'api-key' => env('BREVO_API_KEY', 'xkeysib-demo')],
                'status'           => 'active',
                'last_status_code' => 201,
                'last_latency_ms'  => 210,
                'last_triggered_at'=> now()->subHours(1),
                'payload_sample'   => ['sender' => ['name' => 'ElRond Triaje', 'email' => 'soporte@semilla.pe'], 'subject' => 'Código de Verificación'],
                'is_enabled'       => true,
            ],
            [
                'name'             => 'Backup Cloud Espejo / S3 Bucket',
                'description'      => 'Replicación cifrada en caliente de atenciones, triajes y diagnósticos',
                'type'             => 'p2p_sync',
                'protocol'         => 'CouchDB / S3 Sync (TLSv1.3)',
                'url'              => 'https://backup.semilla.org.pe/s3/triaje-cusco',
                'event'            => 'on_sync_delta',
                'auth_type'        => 'hmac_sha256',
                'auth_token'       => null,
                'secret'           => 's3_sec_c44b9a88c031f',
                'headers'          => ['Content-Type' => 'application/octet-stream', 'X-Cipher' => 'AES-256-GCM'],
                'status'           => 'active',
                'last_status_code' => 200,
                'last_latency_ms'  => 310,
                'last_triggered_at'=> now()->subMinutes(12),
                'payload_sample'   => ['snapshot_id' => 'SNAP-2026-CUS-089', 'records' => 142, 'checksum_sha256' => 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
                'is_enabled'       => true,
            ],
        ];

        foreach ($endpoints as $data) {
            Webhook::firstOrCreate(['name' => $data['name']], $data);
        }
    }
}
