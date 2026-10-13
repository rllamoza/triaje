<?php
/**
 * Test Suite CLI / Web para la API REST de Semilla Triaje (Laravel 11 / 12)
 *
 * Ejecución desde consola:
 *   php test.php
 *   php backend/test.php
 *
 * O desde el navegador:
 *   http://127.0.0.1:8000/test.php (si está en public)
 */

$isCli = (php_sapi_name() === 'cli');

// Limpieza automática de caché de configuración de Laravel si se solicita
if (!$isCli && (isset($_GET['clear_cache']) || isset($_GET['limpiar_cache']))) {
    $cacheDir = dirname(__DIR__) . '/bootstrap/cache';
    @unlink("{$cacheDir}/config.php");
    @unlink("{$cacheDir}/routes-v7.php");
    @unlink("{$cacheDir}/services.php");
    @unlink("{$cacheDir}/packages.php");
    @unlink("{$cacheDir}/events.php");
    echo "<script>alert('¡Caché de Laravel eliminada con éxito! Recargando pruebas...'); window.location.href='" . strtok($_SERVER['REQUEST_URI'], '?') . "';</script>";
    exit;
}

// 1. Detección Inteligente de la URL Base de la API
if (!$isCli && !empty($_SERVER['HTTP_HOST'])) {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $defaultHost = "{$scheme}://{$_SERVER['HTTP_HOST']}/api";
    $baseUrl = isset($_GET['api_url']) && !empty($_GET['api_url']) 
        ? trim($_GET['api_url']) 
        : (getenv('API_URL') ?: $defaultHost);
} else {
    $baseUrl = getenv('API_URL') ?: 'http://127.0.0.1:8000/api';
    if (isset($argv[1])) {
        $baseUrl = trim($argv[1]);
    }
}

// 2. Garantizar SIEMPRE que termine en /api
$baseUrl = rtrim($baseUrl, '/');
if (!str_ends_with($baseUrl, '/api')) {
    $baseUrl .= '/api';
}

// Credenciales configurables por GET en modo Web o por defecto
$email    = (!$isCli && isset($_GET['email'])) ? trim($_GET['email']) : 'admin@semilla.pe';
$password = (!$isCli && isset($_GET['password'])) ? trim($_GET['password']) : 'Admin2025!';

// Estilos / Colores
function outputHeader($title, $isCli) {
    if ($isCli) {
        echo "\n\033[1;36m============================================================\033[0m\n";
        echo "\033[1;37m " . $title . "\033[0m\n";
        echo "\033[1;36m============================================================\033[0m\n\n";
    } else {
        echo "<h2 style='color:#0f62fe;border-bottom:2px solid #0f62fe;padding-bottom:6px;'>{$title}</h2>";
    }
}

function outputResult($name, $success, $code, $details, $isCli) {
    if ($isCli) {
        $status = $success ? "\033[1;32m[ PASS ]\033[0m" : "\033[1;31m[ FAIL ]\033[0m";
        $codeStr = "\033[1;33m(HTTP {$code})\033[0m";
        echo "{$status} {$name} {$codeStr}\n";
        if (!empty($details)) {
            echo "         \033[0;37m" . $details . "\033[0m\n";
        }
    } else {
        $color = $success ? '#198038' : '#da1e28';
        $bg = $success ? '#defbe6' : '#fff1f1';
        $tag = $success ? 'PASS' : 'FAIL';
        echo "<div style='margin-bottom:10px;padding:10px;background:{$bg};border-left:4px solid {$color};font-family:monospace;'>";
        echo "<strong style='color:{$color}'>[ {$tag} ]</strong> <strong>{$name}</strong> (HTTP {$code})<br>";
        if (!empty($details)) {
            echo "<small style='color:#525252;'>{$details}</small>";
        }
        echo "</div>";
    }
}

function makeRequest($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init();
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method !== 'GET') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    $json = $response ? json_decode($response, true) : null;
    return [
        'code' => $httpCode,
        'raw' => $response,
        'json' => $json,
        'error' => $error,
    ];
}

if (!$isCli) {
    echo "<!DOCTYPE html><html lang='es'><head><meta charset='utf-8'><title>Test Suite API Semilla Triaje</title></head><body style='max-width:900px;margin:20px auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:20px;background:#f4f4f4;'>";
}

outputHeader("TEST SUITE: SEMILLA TRIAJE API ({$baseUrl})", $isCli);

$passedCount = 0;
$totalCount = 0;

// ── TEST 1: Nodo y Estado Público ──────────────────────────────────────────
$totalCount++;
$res = makeRequest("{$baseUrl}/auth/node-status");
if ($res['code'] === 200 && isset($res['json']['node_id'])) {
    $passedCount++;
    $nodeId = $res['json']['node_id'] ?? 'N/A';
    $hw = $res['json']['hardware'] ?? 'Edge Node';
    $ping = $res['json']['latency_ms'] ?? 'N/A';
    outputResult("1. GET /auth/node-status (Estado Público)", true, $res['code'], "Nodo: {$nodeId} | Hardware: {$hw} | Latencia: {$ping}ms", $isCli);
} else {
    $errMsg = $res['error'] ?: ($res['json']['message'] ?? substr($res['raw'] ?? '', 0, 100));
    outputResult("1. GET /auth/node-status (Estado Público)", false, $res['code'], "Error: {$errMsg}", $isCli);
}

// ── TEST 2: Autenticación / Login (Sanctum Token) ──────────────────────────
$totalCount++;
$authToken = null;
$res = makeRequest("{$baseUrl}/auth/login", 'POST', [
    'credential' => $email,
    'password'   => $password,
]);

if ($res['code'] === 200 && !empty($res['json']['token'])) {
    $passedCount++;
    $authToken = $res['json']['token'];
    $role = $res['json']['user']['role'] ?? 'N/A';
    $name = $res['json']['user']['full_name'] ?? 'N/A';
    outputResult("2. POST /auth/login (Credenciales Sanctum)", true, $res['code'], "Usuario: {$name} | Rol: {$role} | Token generado OK", $isCli);
} else {
    $errMsg = $res['error'] ?: ($res['json']['message'] ?? substr($res['raw'] ?? '', 0, 100));
    outputResult("2. POST /auth/login (Credenciales Sanctum)", false, $res['code'], "Error de autenticación: {$errMsg}", $isCli);
}

// ── TEST 3: Sesión Actual /auth/me (Bearer Token) ─────────────────────────
$totalCount++;
if ($authToken) {
    $res = makeRequest("{$baseUrl}/auth/me", 'GET', null, $authToken);
    if ($res['code'] === 200 && (isset($res['json']['id']) || isset($res['json']['full_name']))) {
        $passedCount++;
        $userTitle = ($res['json']['full_name'] ?? 'Usuario') . " [DNI: " . ($res['json']['dni'] ?? 'N/A') . "]";
        outputResult("3. GET /auth/me (Validación de Bearer Token)", true, $res['code'], "Sesión verificada: {$userTitle}", $isCli);
    } else {
        outputResult("3. GET /auth/me (Validación de Bearer Token)", false, $res['code'], "Fallo al validar sesión protegida", $isCli);
    }
} else {
    outputResult("3. GET /auth/me (Validación de Bearer Token)", false, 0, "Omitido por fallo en login", $isCli);
}

// ── TEST 4: Campañas Médicas ──────────────────────────────────────────────
$totalCount++;
if ($authToken) {
    $res = makeRequest("{$baseUrl}/campaigns", 'GET', null, $authToken);
    if ($res['code'] === 200 && is_array($res['json'])) {
        $passedCount++;
        $count = count($res['json']);
        $first = $count > 0 ? ($res['json'][0]['name'] ?? '') : 'Sin registros';
        outputResult("4. GET /campaigns (Campañas Médicas Activas)", true, $res['code'], "Campañas encontradas: {$count} (Principal: '{$first}')", $isCli);
    } else {
        outputResult("4. GET /campaigns (Campañas Médicas Activas)", false, $res['code'], "Error obteniendo campañas", $isCli);
    }
} else {
    outputResult("4. GET /campaigns (Campañas Médicas Activas)", false, 0, "Omitido por falta de token", $isCli);
}

// ── TEST 5: Detección de Impresoras (ESC/POS & Epson T88) ─────────────────
$totalCount++;
if ($authToken) {
    $res = makeRequest("{$baseUrl}/printers/status", 'GET', null, $authToken);
    if ($res['code'] === 200 && isset($res['json']['printers'])) {
        $passedCount++;
        $rec = $res['json']['recommended_printer'] ?? 'N/A';
        $t88 = !empty($res['json']['t88_detected']) ? 'DETECTADA' : 'NO DETECTADA';
        $port = $res['json']['default_port'] ?? 'N/A';
        outputResult("5. GET /printers/status (Hardware EPSON TM-T88)", true, $res['code'], "Epson T88: {$t88} | Impresora: '{$rec}' ({$port})", $isCli);
    } else {
        outputResult("5. GET /printers/status (Hardware EPSON TM-T88)", false, $res['code'], "Error consultando spooler de impresoras", $isCli);
    }
} else {
    outputResult("5. GET /printers/status (Hardware EPSON TM-T88)", false, 0, "Omitido por falta de token", $isCli);
}

// ── TEST 6: Beneficiarios / Pacientes ─────────────────────────────────────
$totalCount++;
if ($authToken) {
    $res = makeRequest("{$baseUrl}/beneficiarios", 'GET', null, $authToken);
    if ($res['code'] === 200) {
        $passedCount++;
        $dataList = $res['json']['data'] ?? (is_array($res['json']) ? $res['json'] : []);
        $totalPacientes = count($dataList);
        outputResult("6. GET /beneficiarios (Padrón de Pacientes)", true, $res['code'], "Registros devueltos: {$totalPacientes}", $isCli);
    } else {
        outputResult("6. GET /beneficiarios (Padrón de Pacientes)", false, $res['code'], "Error en padrón de pacientes", $isCli);
    }
} else {
    outputResult("6. GET /beneficiarios (Padrón de Pacientes)", false, 0, "Omitido por falta de token", $isCli);
}

// ── TEST 7: Atenciones Clínicas y Colas de Triaje ─────────────────────────
$totalCount++;
if ($authToken) {
    $res = makeRequest("{$baseUrl}/atenciones", 'GET', null, $authToken);
    if ($res['code'] === 200) {
        $passedCount++;
        $dataList = $res['json']['data'] ?? (is_array($res['json']) ? $res['json'] : []);
        $totalAtenciones = count($dataList);
        outputResult("7. GET /atenciones (Flujo Clínico & Turnos)", true, $res['code'], "Atenciones registradas: {$totalAtenciones}", $isCli);
    } else {
        outputResult("7. GET /atenciones (Flujo Clínico & Turnos)", false, $res['code'], "Error consultando atenciones", $isCli);
    }
} else {
    outputResult("7. GET /atenciones (Flujo Clínico & Turnos)", false, 0, "Omitido por falta de token", $isCli);
}

// ── TEST 8: Auditoría Forense (audi_triaje) ───────────────────────────────
$totalCount++;
if ($authToken) {
    $res = makeRequest("{$baseUrl}/admin/audit/status", 'GET', null, $authToken);
    if ($res['code'] === 200 && isset($res['json']['db_connected'])) {
        $passedCount++;
        $db = $res['json']['db_name'] ?? 'audi_triaje';
        $active = !empty($res['json']['enabled']) ? 'ACTIVA' : 'INACTIVA';
        $records = $res['json']['total_records'] ?? 0;
        outputResult("8. GET /admin/audit/status (Base audi_triaje)", true, $res['code'], "BD: {$db} | Auditoría: {$active} | Logs totales: {$records}", $isCli);
    } else {
        outputResult("8. GET /admin/audit/status (Base audi_triaje)", false, $res['code'], "Error en módulo de auditoría forense", $isCli);
    }
} else {
    outputResult("8. GET /admin/audit/status (Base audi_triaje)", false, 0, "Omitido por falta de token", $isCli);
}

// ── DIAGNÓSTICO PROFUNDO EN CASO DE FALLO ────────────────────────────────
$serverDiag = [];
$lastLogExcerpt = '';
$envPath = dirname(__DIR__) . '/.env';

if (file_exists($envPath)) {
    $envLines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $envMap = [];
    foreach ($envLines as $line) {
        $line = trim($line);
        if (str_starts_with($line, '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $envMap[trim($k)] = trim($v, " \t\n\r\0\x0B\"'");
    }
    
    $serverDiag['APP_KEY'] = !empty($envMap['APP_KEY']) ? 'CONFIGURADO (' . substr($envMap['APP_KEY'], 0, 10) . '...)' : 'FALTA APP_KEY (Causa error 500)';
    $serverDiag['DB_CONNECTION'] = $envMap['DB_CONNECTION'] ?? 'mysql';
    $serverDiag['DB_HOST'] = $envMap['DB_HOST'] ?? '127.0.0.1';
    $serverDiag['DB_DATABASE'] = $envMap['DB_DATABASE'] ?? 'N/A';
    $serverDiag['DB_USERNAME'] = $envMap['DB_USERNAME'] ?? 'N/A';
    
    // Comprobar si existe caché de configuración que bloquea los cambios en .env
    $configCacheFile = dirname(__DIR__) . '/bootstrap/cache/config.php';
    if (file_exists($configCacheFile)) {
        $serverDiag['CACHÉ_LARAVEL'] = "¡EXISTE CACHÉ ANTIGUA! (Laravel ignora cambios de .env) <a href='?clear_cache=1' style='background:#da1e28;color:#fff;padding:2px 8px;border-radius:3px;text-decoration:none;font-weight:bold;margin-left:8px;'>[CLIC AQUÍ PARA BORRAR CACHÉ]</a>";
    } else {
        $serverDiag['CACHÉ_LARAVEL'] = "LIMPIA (Laravel lee directamente el archivo .env)";
    }
    
    try {
        if (($envMap['DB_CONNECTION'] ?? '') === 'sqlite') {
            $sqlitePath = dirname(__DIR__) . '/database/' . ($envMap['DB_DATABASE'] ?? 'database.sqlite');
            $pdo = new PDO("sqlite:" . $sqlitePath);
        } else {
            $pdo = new PDO(
                "mysql:host=" . ($envMap['DB_HOST'] ?? '127.0.0.1') . ";port=" . ($envMap['DB_PORT'] ?? 3306) . ";dbname=" . ($envMap['DB_DATABASE'] ?? '') . ";charset=utf8mb4",
                $envMap['DB_USERNAME'] ?? '',
                $envMap['DB_PASSWORD'] ?? '',
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]
            );
        }
        $serverDiag['ESTADO_CONEXION_BD'] = "CONECTADO EXITOSAMENTE";
        
        // Comprobar tabla users
        $chkUsers = $pdo->query("SHOW TABLES LIKE 'users'")->fetchAll();
        if (count($chkUsers) > 0) {
            $uCount = $pdo->query("SELECT count(*) FROM users")->fetchColumn();
            $serverDiag['TABLA_USERS'] = "EXISTE (Total usuarios registrados: {$uCount})";
        } else {
            $serverDiag['TABLA_USERS'] = "NO EXISTE (Debes importar triaje_produccion.sql)";
        }
        
        // Comprobar personal_access_tokens
        $chkTokens = $pdo->query("SHOW TABLES LIKE 'personal_access_tokens'")->fetchAll();
        $serverDiag['TABLA_SANCTUM_TOKENS'] = (count($chkTokens) > 0) ? "EXISTE" : "NO EXISTE (Falta importar triaje_produccion.sql)";
        
    } catch (\Throwable $e) {
        $serverDiag['ESTADO_CONEXION_BD'] = "FALLÓ LA CONEXIÓN: " . $e->getMessage();
    }
}

// Últimos errores de laravel.log (Extracción inteligente del encabezado del error)
$logFile = dirname(__DIR__) . '/storage/logs/laravel.log';
if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    if (!empty($logContent)) {
        // Separar por cada entrada de log que inicia con [YYYY-MM-DD
        $entries = preg_split('/(?=\[\d{4}-\d{2}-\d{2}\s)/', $logContent);
        $entries = array_filter($entries, function($e) { return !empty(trim($e)); });
        if (!empty($entries)) {
            $lastEntry = end($entries);
            $entryLines = explode("\n", trim($lastEntry));
            // Las primeras 12 líneas contienen la fecha, nivel, mensaje de error exacto y archivo causante
            $lastLogExcerpt = implode("\n", array_slice($entryLines, 0, 12));
        }
    }
}

// ── RESUMEN FINAL ─────────────────────────────────────────────────────────
if ($isCli) {
    echo "\n\033[1;36m------------------------------------------------------------\033[0m\n";
    if ($passedCount === $totalCount) {
        echo "\033[1;32m RESULTADO: TODOS LOS TESTS PASARON EXITOSAMENTE ({$passedCount}/{$totalCount})\033[0m\n";
    } else {
        echo "\033[1;33m RESULTADO: {$passedCount} DE {$totalCount} TESTS PASARON\033[0m\n";
    }
    echo "\033[1;36m------------------------------------------------------------\033[0m\n\n";

    if (!empty($serverDiag)) {
        echo "\033[1;35m--- DIAGNÓSTICO DEL SERVIDOR (.env & Base de Datos) ---\033[0m\n";
        foreach ($serverDiag as $k => $v) {
            echo "  * {$k}: {$v}\n";
        }
        echo "\n";
    }
    if (!empty($lastLogExcerpt) && $passedCount < $totalCount) {
        echo "\033[1;31m--- ÚLTIMO ERROR EN storage/logs/laravel.log ---\033[0m\n";
        echo substr($lastLogExcerpt, 0, 600) . "\n\n";
    }
} else {
    $summaryColor = ($passedCount === $totalCount) ? '#198038' : '#b28600';
    echo "<div style='margin-top:20px;padding:15px;background:#fff;border:2px solid {$summaryColor};font-family:sans-serif;'>";
    echo "<h3 style='color:{$summaryColor};margin:0 0 5px 0;'>Resultado de la Suite</h3>";
    echo "<p style='margin:0;'><strong>{$passedCount} de {$totalCount}</strong> pruebas pasadas con éxito.</p>";
    echo "</div>";

    if (!empty($serverDiag)) {
        echo "<div style='margin-top:20px;padding:15px;background:#fff;border:1px solid #dcdcdc;border-radius:4px;font-family:sans-serif;'>";
        echo "<h3 style='margin-top:0;color:#0f62fe;'>Diagnóstico Interno del Servidor</h3>";
        echo "<ul style='line-height:1.8;'>";
        foreach ($serverDiag as $k => $v) {
            $isBad = str_contains($v, 'FALLÓ') || str_contains($v, 'NO EXISTE') || str_contains($v, 'FALTA');
            $color = $isBad ? '#da1e28' : '#198038';
            $weight = $isBad ? 'bold' : 'normal';
            echo "<li><strong>{$k}:</strong> <span style='color:{$color};font-weight:{$weight};'>{$v}</span></li>";
        }
        echo "</ul>";
        if (!empty($lastLogExcerpt) && $passedCount < $totalCount) {
            echo "<h4 style='color:#da1e28;margin:15px 0 5px 0;'>Último error registrado en storage/logs/laravel.log:</h4>";
            echo "<pre style='background:#161616;color:#ff8389;padding:12px;border-radius:4px;overflow-x:auto;font-size:12px;max-height:250px;white-space:pre-wrap;'>" . htmlspecialchars($lastLogExcerpt) . "</pre>";
        }
        echo "</div>";
    }

    echo "</body></html>";
}
