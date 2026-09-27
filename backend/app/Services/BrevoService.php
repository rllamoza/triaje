<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class BrevoService
{
    private string $apiKey;
    private string $senderEmail;
    private string $senderName;
    private int $dailyLimit;
    private ?int $verifyTemplateId;

    public function __construct()
    {
        $this->apiKey = (string) config('services.brevo.api_key', env('BREVO_API_KEY', ''));
        $this->senderEmail = (string) config('services.brevo.sender_email', env('BREVO_SENDER_EMAIL', 'notificaciones@semilla.pe'));
        $this->senderName = (string) config('services.brevo.sender_name', env('BREVO_SENDER_NAME', 'ElRond Sistema de Gestion Medica - Modulo de Triaje'));
        $this->dailyLimit = (int) config('services.brevo.daily_limit', env('BREVO_DAILY_LIMIT', 300));
        
        $templateId = config('services.brevo.template_verify_code', env('BREVO_TEMPLATE_VERIFY_CODE'));
        $this->verifyTemplateId = !empty($templateId) ? (int) $templateId : null;
    }

    /**
     * Verifica si la API Key está configurada.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->senderEmail);
    }

    /**
     * Obtiene el número de correos enviados hoy.
     */
    public function getTodaySentCount(): int
    {
        $cacheKey = 'brevo_daily_count_' . date('Y-m-d');
        return (int) Cache::get($cacheKey, 0);
    }

    /**
     * Incrementa el conteo de correos del día.
     */
    private function incrementDailyCount(): void
    {
        $cacheKey = 'brevo_daily_count_' . date('Y-m-d');
        $expiresAt = now()->endOfDay();
        Cache::put($cacheKey, $this->getTodaySentCount() + 1, $expiresAt);
    }

    /**
     * Comprueba si aún queda cuota diaria disponible (Plan Free: 300/día).
     */
    public function hasAvailableDailyQuota(): bool
    {
        return $this->getTodaySentCount() < $this->dailyLimit;
    }

    /**
     * Enviar código de verificación de 6 dígitos.
     */
    public function sendVerificationCode(string $email, string $nombre, string $code): array
    {
        if (!$this->isConfigured()) {
            Log::warning('[BrevoService] API Key o Sender no configurados en .env. Código simulado: ' . $code);
            return [
                'success' => false,
                'simulated' => true,
                'message' => 'BREVO_API_KEY no configurada. En entorno de prueba el código es: ' . $code,
            ];
        }

        if (!$this->hasAvailableDailyQuota()) {
            Log::error('[BrevoService] Límite diario de envíos alcanzado (300/día).');
            return [
                'success' => false,
                'error' => 'Se ha alcanzado el límite diario de correos permitidos por el plan.',
            ];
        }

        // Construir payload
        $payload = [
            'sender' => [
                'email' => $this->senderEmail,
                'name'  => $this->senderName,
            ],
            'to' => [
                [
                    'email' => $email,
                    'name'  => $nombre,
                ]
            ],
            'subject' => "Código de Verificación: {$code} - {$this->senderName}",
        ];

        // Si se configuró un templateId oficial en Brevo
        if ($this->verifyTemplateId) {
            $payload['templateId'] = $this->verifyTemplateId;
            $payload['params'] = [
                'nombre' => $nombre,
                'codigo' => $code,
                'tiempo_expiracion' => '15 minutos',
                'app_name' => $this->senderName,
            ];
        } else {
            // Plantilla HTML de respaldo con diseño médico profesional y seguro
            $payload['htmlContent'] = $this->buildVerificationHtml($nombre, $code);
        }

        return $this->executeSend($payload);
    }

    /**
     * Enviar correo de prueba para verificar conectividad y API Key.
     */
    public function sendTestEmail(string $recipientEmail): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'BREVO_API_KEY o BREVO_SENDER_EMAIL no configurados en .env',
            ];
        }

        $payload = [
            'sender' => [
                'email' => $this->senderEmail,
                'name'  => $this->senderName,
            ],
            'to' => [
                [
                    'email' => $recipientEmail,
                    'name'  => 'Usuario de Prueba',
                ]
            ],
            'subject' => "Prueba de Integración Brevo - {$this->senderName}",
            'htmlContent' => '
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0d9488;">¡Integración con Brevo Exitosa!</h2>
                    <p>Este correo confirma que tu clave API de Brevo y el remitente están configurados correctamente en <strong>ElRond Sistema de Gestión Médica - Módulo de Triaje</strong>.</p>
                    <p style="font-size: 12px; color: #64748b;">Enviado el ' . now()->format('d/m/Y H:i:s') . '</p>
                </div>
            '
        ];

        return $this->executeSend($payload);
    }

    /**
     * Ejecutar petición HTTP POST a la API de Brevo.
     */
    private function executeSend(array $payload): array
    {
        try {
            $response = Http::withHeaders([
                'api-key'      => $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ])->timeout(12)->post('https://api.brevo.com/v3/smtp/email', $payload);

            if ($response->successful()) {
                $this->incrementDailyCount();
                $data = $response->json();
                $messageId = $data['messageId'] ?? null;

                Log::info('[BrevoService] Correo enviado exitosamente.', [
                    'to' => $payload['to'][0]['email'] ?? '',
                    'messageId' => $messageId,
                    'daily_sent' => $this->getTodaySentCount()
                ]);

                return [
                    'success' => true,
                    'message_id' => $messageId,
                    'sent_today' => $this->getTodaySentCount(),
                ];
            }

            $status = $response->status();
            $body = $response->json() ?? $response->body();
            
            Log::error('[BrevoService] Error de Brevo al enviar correo.', [
                'status' => $status,
                'response' => $body,
            ]);

            $errorMsg = is_array($body) && isset($body['message']) 
                ? $body['message'] 
                : "Error {$status} retornado por Brevo";

            return [
                'success' => false,
                'status' => $status,
                'error' => $errorMsg,
            ];
        } catch (\Throwable $e) {
            Log::error('[BrevoService] Excepción de conexión al enviar correo: ' . $e->getMessage());

            return [
                'success' => false,
                'error' => 'Error de conexión con el servicio de correo: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Generador de plantilla HTML de respaldo elegante para el código de 6 dígitos.
     */
    private function buildVerificationHtml(string $nombre, string $codigo): string
    {
        return '
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
                .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07); }
                .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
                .header h1 { margin: 0 0 8px 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
                .header p { margin: 0; font-size: 14px; opacity: 0.9; }
                .body { padding: 32px 28px; color: #334155; }
                .greeting { font-size: 16px; margin-bottom: 16px; }
                .instructions { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 24px; }
                .code-box { background: #f8fafc; border: 2px dashed #0d9488; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
                .code-digits { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0f766e; font-family: monospace; }
                .expires { font-size: 13px; color: #94a3b8; margin-top: 8px; }
                .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>ElRond Sistema de Gestión Médica</h1>
                    <p>Módulo de Triaje • Registro de Voluntarios</p>
                </div>
                <div class="body">
                    <p class="greeting">Hola, <strong>' . htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') . '</strong>:</p>
                    <p class="instructions">Gracias por unirte como voluntario a nuestra plataforma médica. Para confirmar tu dirección de correo electrónico y activar tu cuenta, ingresa el siguiente código de validación de 6 dígitos en la aplicación:</p>
                    
                    <div class="code-box">
                        <div class="code-digits">' . htmlspecialchars($codigo, ENT_QUOTES, 'UTF-8') . '</div>
                        <div class="expires">⏱️ Este código expira en 15 minutos</div>
                    </div>

                    <p class="instructions" style="font-size: 13px;">Si no solicitaste este registro, puedes desestimar este mensaje de manera segura.</p>
                </div>
                <div class="footer">
                    <p>© ' . date('Y') . ' ElRond Sistema de Gestión Médica - Módulo de Triaje</p>
                </div>
            </div>
        </body>
        </html>
        ';
    }
}
