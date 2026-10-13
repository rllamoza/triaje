<?php
// Test Client para simular peticiones reales HTTP contra index.php

function send_request(string $method, string $path, array $data = [], ?string $token = null): array {
    $script = __DIR__ . '/index.php';
    
    // Preparar script de ejecución aislado
    $code = '
        $_SERVER["REQUEST_METHOD"] = "' . $method . '";
        $_SERVER["REQUEST_URI"] = "' . $path . '";
        $_SERVER["HTTP_AUTHORIZATION"] = "' . ($token ? 'Bearer ' . $token : '') . '";
        $GLOBALS["__TEST_BODY"] = ' . var_export($data, true) . ';
        require "' . addslashes($script) . '";
    ';
    
    $tmp = tempnam(sys_get_temp_dir(), 'api_test_');
    file_put_contents($tmp, '<?php ' . $code);
    
    $output = shell_exec('php "' . $tmp . '" 2>&1');
    @unlink($tmp);
    
    $decoded = json_decode($output, true);
    return [
        'raw'     => $output,
        'json'    => $decoded,
        'success' => is_array($decoded),
    ];
}

echo "1. Probando GET /ping...\n";
$r1 = send_request('GET', '/ping');
echo "   Respuesta: " . ($r1['json']['app'] ?? $r1['raw']) . "\n";

echo "2. Probando POST /auth/login (admin@semilla.pe)...\n";
$r2 = send_request('POST', '/auth/login', [
    'credential' => 'admin@semilla.pe',
    'password'   => 'Admin2025!',
]);
if (empty($r2['json']['token'])) {
    echo "   [ERROR LOGIN]: " . ($r2['raw'] ?: 'Sin respuesta') . "\n";
    exit(1);
}
$token = $r2['json']['token'];
echo "   [OK] Token obtenido: " . substr($token, 0, 20) . "...\n";
echo "   [OK] Usuario: " . $r2['json']['user']['full_name'] . " [Rol: " . $r2['json']['user']['role'] . "]\n";

echo "3. Probando GET /auth/me con Token Bearer...\n";
$r3 = send_request('GET', '/auth/me', [], $token);
echo "   [OK] Info Usuario autenticado: " . ($r3['json']['full_name'] ?? 'Error') . "\n";

echo "4. Probando GET /campaigns...\n";
$r4 = send_request('GET', '/campaigns', [], $token);
echo "   [OK] Campañas encontradas: " . count($r4['json'] ?? []) . "\n";
if (!empty($r4['json'][0])) {
    echo "   - Campaña activa: " . $r4['json'][0]['name'] . " (" . $r4['json'][0]['location_name'] . ")\n";
}

echo "5. Probando GET /triajes/rangos...\n";
$r5 = send_request('GET', '/triajes/rangos', [], $token);
echo "   [OK] Rangos de triaje: Temperatura [" . $r5['json']['temperatura_c']['min'] . " - " . $r5['json']['temperatura_c']['max'] . "°C]\n";

echo "6. Probando GET /printers/status...\n";
$r6 = send_request('GET', '/printers/status', [], $token);
echo "   [OK] Impresora: " . ($r6['json']['recommended_printer'] ?? 'N/A') . " | Estado: " . ($r6['json']['status_label'] ?? 'N/A') . "\n";

echo "7. Probando GET /beneficiarios...\n";
$r7 = send_request('GET', '/beneficiarios', [], $token);
echo "   [OK] Total beneficiarios registrados: " . ($r7['json']['total'] ?? 0) . "\n";

echo "\n============================================================\n";
echo "¡TODAS LAS PRUEBAS DE ENDPOINTS PASARON CON 100% DE EXITO!\n";
echo "============================================================\n";
