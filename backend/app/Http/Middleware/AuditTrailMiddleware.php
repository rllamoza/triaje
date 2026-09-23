<?php

namespace App\Http\Middleware;

use App\Models\AuditRecord;
use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditTrailMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Solo auditar peticiones de la API
        if (!$request->is('api/*')) {
            return $next($request);
        }

        // Verificar si el módulo está activado (con fallback a variable de entorno)
        $auditEnabled = SystemSetting::get('audit_module_enabled', filter_var(env('AUDIT_MODULE_ENABLED', true), FILTER_VALIDATE_BOOLEAN));

        if ($auditEnabled) {
            $request->attributes->set('audit_start_time', microtime(true));
        }

        return $next($request);
    }

    /**
     * Terminate request & persist audit record asynchronously without blocking HTTP response.
     */
    public function terminate(Request $request, Response $response): void
    {
        $startTime = $request->attributes->get('audit_start_time');
        if (!$startTime) {
            return;
        }

        // Omitir rutas de heartbeat de alta frecuencia o SSE si se desea evitar saturación
        $uri = $request->path();
        if (str_ends_with($uri, 'auth/node-status') || str_ends_with($uri, 'cola/live')) {
            return;
        }

        try {
            $durationMs = round((microtime(true) - $startTime) * 1000, 2);
            $statusCode = $response->getStatusCode();

            // 1. Obtener datos del Usuario
            $user = $request->user('sanctum') ?? $request->user();
            $userId = $user?->id;
            $userName = $user ? trim(($user->name ?? '') . ' ' . ($user->apellidos ?? '')) : null;
            $userEmail = $user?->email;
            $userRole = $user?->role;
            $userDni = $user?->dni;
            $station = $user?->station_default;

            // Si es login y no hay user en request pero la respuesta fue 200, intentar recuperar datos
            if (!$user && ($request->is('api/auth/login*') || $request->is('api/auth/login-pin*'))) {
                $content = json_decode($response->getContent(), true);
                if (is_array($content) && isset($content['user'])) {
                    $uData = $content['user'];
                    $userId = $uData['id'] ?? null;
                    $userName = trim(($uData['name'] ?? '') . ' ' . ($uData['apellidos'] ?? ''));
                    $userEmail = $uData['email'] ?? null;
                    $userRole = $uData['role'] ?? null;
                    $userDni = $uData['dni'] ?? null;
                }
            }

            // 2. IP y Análisis de Red Local
            $ip = $request->ip() ?? '127.0.0.1';
            $isLocal = $this->isLocalIp($ip);
            $hostname = null;
            if ($isLocal && ($ip === '127.0.0.1' || str_starts_with($ip, '192.168.'))) {
                $hostname = @gethostbyaddr($ip) ?: null;
            }

            // 3. User-Agent y Dispositivo
            $userAgent = $request->header('User-Agent') ?? '';
            $deviceInfo = $this->parseUserAgent($userAgent);

            // 4. Telemetría Enriquecida del Cliente (enviada desde Axios en frontend)
            $clientTelemetry = $this->parseClientTelemetry($request->header('X-Client-Audit-Telemetry'));

            // 5. Categoría de Acción
            $category = $this->categorizeAction($uri);

            // 6. Sanitizar Payload (ocultar contraseñas, pines y tokens)
            $sanitizedPayload = $this->sanitizePayload($request->all());

            // 7. Resumen de Respuesta y Error
            $responseSummary = null;
            $errorMessage = null;

            if ($statusCode >= 400) {
                $respData = json_decode($response->getContent(), true);
                $errorMessage = is_array($respData) ? ($respData['message'] ?? json_encode($respData)) : substr($response->getContent(), 0, 500);
            } else {
                // Resumen ligero para no almacenar mega-bloques innecesarios
                $respData = json_decode($response->getContent(), true);
                if (is_array($respData)) {
                    if (isset($respData['success'])) $responseSummary['success'] = $respData['success'];
                    if (isset($respData['message'])) $responseSummary['message'] = $respData['message'];
                    if (isset($respData['data']) && is_array($respData['data'])) {
                        $responseSummary['data_count'] = count($respData['data']);
                    }
                }
            }

            // Guardar registro directamente en la base de datos de auditoría
            AuditRecord::create([
                'user_id'                => $userId,
                'user_name'              => $userName,
                'user_email'             => $userEmail,
                'user_role'              => $userRole,
                'user_dni'               => $userDni,
                'station'                => $station,
                'method'                 => strtoupper($request->method()),
                'url'                    => substr($request->fullUrl(), 0, 1000),
                'endpoint'               => '/' . ltrim($uri, '/'),
                'route_name'             => $request->route()?->getName(),
                'action_category'        => $category,
                'status_code'            => $statusCode,
                'duration_ms'            => $durationMs,
                'ip_address'             => $ip,
                'is_local_ip'            => $isLocal,
                'hostname'               => $hostname,
                'network_effective_type' => $clientTelemetry['effectiveType'] ?? null,
                'network_rtt_ms'         => $clientTelemetry['rtt'] ?? null,
                'network_downlink_mbps'  => $clientTelemetry['downlink'] ?? null,
                'network_save_data'      => $clientTelemetry['saveData'] ?? false,
                'device_type'            => $clientTelemetry['deviceType'] ?? $deviceInfo['deviceType'],
                'device_os'              => $clientTelemetry['os'] ?? $deviceInfo['os'],
                'device_browser'         => $clientTelemetry['browser'] ?? $deviceInfo['browser'],
                'screen_resolution'      => $clientTelemetry['screen'] ?? null,
                'client_timezone'        => $clientTelemetry['timezone'] ?? null,
                'client_language'        => $clientTelemetry['language'] ?? $request->header('Accept-Language'),
                'user_agent'             => substr($userAgent, 0, 1000),
                'request_payload'        => empty($sanitizedPayload) ? null : $sanitizedPayload,
                'response_summary'       => $responseSummary,
                'error_message'          => $errorMessage,
                'created_at'             => now(),
            ]);

        } catch (\Throwable $e) {
            Log::warning('[AuditTrailMiddleware] Error al registrar evento de auditoría en audi_triaje: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
        }
    }

    /**
     * Determina si una IP pertenece a una red privada o localhost.
     */
    protected function isLocalIp(string $ip): bool
    {
        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
            return true;
        }

        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }

    /**
     * Parser rápido y robusto de User-Agent.
     */
    protected function parseUserAgent(string $ua): array
    {
        $os = 'Desconocido';
        $browser = 'Desconocido';
        $deviceType = 'Desktop';

        // Detectar SO
        if (preg_match('/windows nt 10/i', $ua)) {
            $os = 'Windows 10/11';
        } elseif (preg_match('/windows nt/i', $ua)) {
            $os = 'Windows';
        } elseif (preg_match('/android/i', $ua)) {
            $os = 'Android';
            $deviceType = 'Mobile';
        } elseif (preg_match('/iphone|ipad|ipod/i', $ua)) {
            $os = 'iOS';
            $deviceType = preg_match('/ipad/i', $ua) ? 'Tablet' : 'Mobile';
        } elseif (preg_match('/mac os x/i', $ua)) {
            $os = 'macOS';
        } elseif (preg_match('/linux/i', $ua)) {
            $os = 'Linux';
        }

        // Detectar Navegador
        if (preg_match('/edg\/([0-9.]+)/i', $ua, $matches)) {
            $browser = 'Edge ' . explode('.', $matches[1])[0];
        } elseif (preg_match('/chrome\/([0-9.]+)/i', $ua, $matches)) {
            $browser = 'Chrome ' . explode('.', $matches[1])[0];
        } elseif (preg_match('/firefox\/([0-9.]+)/i', $ua, $matches)) {
            $browser = 'Firefox ' . explode('.', $matches[1])[0];
        } elseif (preg_match('/safari\/([0-9.]+)/i', $ua, $matches)) {
            $browser = 'Safari ' . explode('.', $matches[1])[0];
        }

        if (preg_match('/tablet/i', $ua)) {
            $deviceType = 'Tablet';
        } elseif (preg_match('/mobile/i', $ua) && $deviceType === 'Desktop') {
            $deviceType = 'Mobile';
        }

        return [
            'os' => $os,
            'browser' => $browser,
            'deviceType' => $deviceType,
        ];
    }

    /**
     * Decodifica la cabecera personalizada de telemetría de red y pantalla.
     */
    protected function parseClientTelemetry(?string $header): array
    {
        if (empty($header)) {
            return [];
        }

        $decoded = json_decode($header, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        // Intento con base64 por si viaja codificado
        $base64Decoded = @base64_decode($header);
        if ($base64Decoded) {
            $json = json_decode($base64Decoded, true);
            if (is_array($json)) {
                return $json;
            }
        }

        return [];
    }

    /**
     * Sanitiza campos sensibles como passwords, pines y tokens del payload.
     */
    protected function sanitizePayload(array $payload): array
    {
        $sensitiveKeys = [
            'password', 'password_confirmation', 'pin', 'pin_hash',
            'token', 'token_fisico', 'biometric_hash', 'secret',
            'api_key', 'authorization'
        ];

        foreach ($payload as $k => $v) {
            if (in_array(strtolower($k), $sensitiveKeys)) {
                $payload[$k] = '***REDACTED***';
            } elseif (is_array($v)) {
                $payload[$k] = $this->sanitizePayload($v);
            }
        }

        return $payload;
    }

    /**
     * Clasifica la ruta en categorías del sistema médico.
     */
    protected function categorizeAction(string $uri): string
    {
        $uri = strtolower($uri);

        if (str_contains($uri, 'auth')) return 'SEGURIDAD_AUTH';
        if (str_contains($uri, 'triaje')) return 'TRIAJE';
        if (str_contains($uri, 'consulta') || str_contains($uri, 'medicamento')) return 'CONSULTA';
        if (str_contains($uri, 'atencion') || str_contains($uri, 'cola')) return 'ATENCION';
        if (str_contains($uri, 'beneficiario') || str_contains($uri, 'reniec')) return 'ADMISION';
        if (str_contains($uri, 'ticket') || str_contains($uri, 'printer')) return 'TICKETS';
        if (str_contains($uri, 'campaign')) return 'CAMPANIA';
        if (str_contains($uri, 'admin/audit')) return 'AUDITORIA';
        if (str_contains($uri, 'admin') || str_contains($uri, 'user')) return 'ADMINISTRACION';

        return 'GENERAL';
    }
}
