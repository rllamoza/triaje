<?php
// ============================================================
// SUITE MAESTRA DE PRUEBAS DE INTEGRIDAD Y FLUJO DEL SISTEMA
// Semilla Triaje - Test Suite Runner
// ============================================================

$tests = [
    '01_database_constants_test.php' => 'Persistencia de Constantes en BD & Simulación de Apagado/Encendido',
    '02_patient_flow_test.php'       => 'Flujo de Admisión y Registro de Paciente (Antecedentes Inactivos)',
    '03_triaje_flow_test.php'        => 'Integridad de Flujo Clínico (Triaje Activo vs Triaje Inactivo)',
    '04_branding_ticket_test.php'    => 'Motor Térmico ESC/POS: Legibilidad, Centrado y Ocultamiento de QR',
];

echo "\n================================================================================\n";
echo "       SEMILLA TRIAJE - SUITE MAESTRA DE PRUEBAS DE INTEGRIDAD Y FLUJO           \n";
echo "================================================================================\n";
echo "Fecha y Hora: " . date('Y-m-d H:i:s') . "\n";
echo "Versión del Sistema: 1.0.5\n";
echo "Total de Módulos de Prueba: " . count($tests) . "\n";
echo "--------------------------------------------------------------------------------\n\n";

$allPassed = true;
$summary = [];
$totalStartTime = microtime(true);

foreach ($tests as $file => $description) {
    $filePath = __DIR__ . '/' . $file;
    if (!file_exists($filePath)) {
        echo "[ERROR CRÍTICO] Archivo de prueba no encontrado: {$file}\n";
        $allPassed = false;
        continue;
    }

    echo ">> Ejecutando: {$file} - {$description}...\n";
    $testStart = microtime(true);

    $descriptorspec = [
        0 => ["pipe", "r"], // stdin
        1 => ["pipe", "w"], // stdout
        2 => ["pipe", "w"]  // stderr
    ];

    $process = proc_open("php \"{$filePath}\"", $descriptorspec, $pipes);
    if (is_resource($process)) {
        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);
        $duration = round(microtime(true) - $testStart, 3);

        echo $stdout;
        if (!empty($stderr)) {
            echo "[STDERR]: " . $stderr . "\n";
        }

        $status = ($exitCode === 0) ? 'PASSED' : 'FAILED';
        if ($exitCode !== 0) {
            $allPassed = false;
        }

        $summary[] = [
            'file' => $file,
            'name' => $description,
            'status' => $status,
            'duration' => $duration . 's',
            'code' => $exitCode,
        ];
    } else {
        echo "[ERROR] No se pudo invocar el subproceso para {$file}\n";
        $allPassed = false;
    }
    echo "--------------------------------------------------------------------------------\n";
}

$totalDuration = round(microtime(true) - $totalStartTime, 3);

echo "\n================================================================================\n";
echo "                        RESUMEN FINAL DE PRUEBAS                                \n";
echo "================================================================================\n";
printf("%-32s | %-10s | %-10s | %s\n", "Módulo de Prueba", "Estado", "Duración", "Descripción");
echo str_repeat("-", 80) . "\n";

foreach ($summary as $item) {
    $badge = ($item['status'] === 'PASSED') ? "[ PASS ]" : "[ FAIL ]";
    printf("%-32s | %-10s | %-10s | %s\n", $item['file'], $badge, $item['duration'], $item['name']);
}

echo str_repeat("=", 80) . "\n";
echo "Duración Total: {$totalDuration}s\n";

if ($allPassed) {
    echo "\n>>> RESULTADO FINAL: TODAS LAS PRUEBAS DE INTEGRIDAD Y FLUJO PASARON CON ÉXITO (100%) <<<\n";
    echo ">>> TODAS LAS CONSTANTES Y CONFIGURACIONES QUEDARON ASENTADAS EN LA BASE DE DATOS <<<\n\n";
    exit(0);
} else {
    echo "\n>>> RESULTADO FINAL: SE ENCONTRARON FALLOS EN LA SUITE DE PRUEBAS <<<\n\n";
    exit(1);
}

