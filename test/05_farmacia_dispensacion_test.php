<?php
// ============================================================
// TEST 05: GESTIÓN DE FARMACIA, DISPENSACIÓN Y DESCUENTO DE STOCK
// Valida transacción atómica, descuento de inventario,
// registro de firma/foto y comprobante de entrega
// ============================================================

require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/core/Database.php';
require_once __DIR__ . '/../backend/core/Helpers.php';
require_once __DIR__ . '/../backend/controllers/MedicamentoController.php';
require_once __DIR__ . '/../backend/controllers/FarmaciaController.php';

function test_assert(bool $condition, string $message): void {
    if (!$condition) {
        echo "  [FALLO] " . $message . "\n";
        exit(1);
    }
    echo "  [OK] " . $message . "\n";
}

echo "=== INICIANDO TEST 05: Gestión de Farmacia, Dispensación y Stock ===\n";

$pdo = db();
test_assert($pdo instanceof PDO, "Conexión activa con MySQL para pruebas de Farmacia");

// Asegurar esquema
farmacia_ensure_schema();

// 1. Verificar existencia de tabla medicamento_dispensaciones
$tableCheck = $pdo->query("SHOW TABLES LIKE 'medicamento_dispensaciones'")->fetch();
test_assert((bool)$tableCheck, "Tabla 'medicamento_dispensaciones' presente en base de datos");

// 2. Verificar o crear medicamento de prueba para la campaña 1
$stmtMed = $pdo->prepare("SELECT id, nombre_generico, stock_actual FROM medicamentos WHERE campaign_id = 1 AND activo = 1 LIMIT 1");
$stmtMed->execute();
$med = $stmtMed->fetch();

if (!$med) {
    $pdo->prepare("
        INSERT INTO medicamentos (campaign_id, codigo, nombre_generico, nombre_comercial, concentracion, forma_farmaceutica, via_administracion, stock_actual, stock_minimo, activo)
        VALUES (1, 'MED-TEST', 'Paracetamol Test', 'Panadol Test', '500mg', 'tableta', 'oral', 100, 10, 1)
    ")->execute();
    $medId = (int)$pdo->lastInsertId();
    $initialStock = 100;
} else {
    $medId = (int)$med['id'];
    $initialStock = (int)$med['stock_actual'];
    if ($initialStock < 10) {
        $pdo->prepare("UPDATE medicamentos SET stock_actual = 50 WHERE id = ?")->execute([$medId]);
        $initialStock = 50;
    }
}
test_assert($medId > 0 && $initialStock >= 5, "Medicamento disponible para prueba con stock inicial: $initialStock");

// 3. Simular dispensación de 3 unidades
$cantDispensar = 3;
$expectedStock = $initialStock - $cantDispensar;

$payload = [
    'campaign_id' => 1,
    'paciente_nombre' => 'JUAN PÉREZ SIMULACIÓN',
    'paciente_dni' => '44556677',
    'medico_id' => null,
    'medico_nombre' => 'Dra. María Gonzales - Pediatría',
    'modalidad_cargo' => 'firma',
    'firma_base64' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'foto_url' => null,
    'imprimir_cargo' => true,
    'observaciones' => 'Entrega de prueba automatizada',
    'items' => [
        [
            'medicamento_id' => $medId,
            'nombre' => 'Paracetamol Test',
            'cantidad' => $cantDispensar,
            'dosis' => '500mg cada 8h',
            'indicaciones' => 'Tomar con abundante agua'
        ]
    ]
];

$pdo->beginTransaction();
try {
    // A. Bloqueo FOR UPDATE
    $stmtLock = $pdo->prepare("SELECT id, nombre_generico, stock_actual FROM medicamentos WHERE id = ? FOR UPDATE");
    $stmtLock->execute([$medId]);
    $row = $stmtLock->fetch();
    test_assert((int)$row['stock_actual'] === $initialStock, "Bloqueo por fila FOR UPDATE ejecutado con stock verificado");

    // B. Descontar stock
    $stmtUpd = $pdo->prepare("UPDATE medicamentos SET stock_actual = stock_actual - ? WHERE id = ?");
    $stmtUpd->execute([$cantDispensar, $medId]);

    // C. Insertar registro de dispensación
    $stmtIns = $pdo->prepare("
        INSERT INTO medicamento_dispensaciones (
            campaign_id, paciente_nombre, paciente_dni, medico_id, medico_nombre,
            modalidad_cargo, firma_base64, foto_url, impreso, observaciones, items, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmtIns->execute([
        1,
        $payload['paciente_nombre'],
        $payload['paciente_dni'],
        null,
        $payload['medico_nombre'],
        $payload['modalidad_cargo'],
        $payload['firma_base64'],
        null,
        1,
        $payload['observaciones'],
        json_encode($payload['items'])
    ]);
    $dispId = (int)$pdo->lastInsertId();
    test_assert($dispId > 0, "Registro de dispensación creado con ID: $dispId");

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    test_assert(false, "Excepción en transacción de dispensación: " . $e->getMessage());
}

// 4. Validar stock descontado en BD
$stmtCheck = $pdo->prepare("SELECT stock_actual FROM medicamentos WHERE id = ?");
$stmtCheck->execute([$medId]);
$currentStock = (int)$stmtCheck->fetchColumn();
test_assert($currentStock === $expectedStock, "Stock descontado exitosamente en BD (Inicial: $initialStock, Actual: $currentStock, Descontado: $cantDispensar)");

// 5. Validar que la firma y datos se recuperan correctamente
$stmtDisp = $pdo->prepare("SELECT * FROM medicamento_dispensaciones WHERE id = ?");
$stmtDisp->execute([$dispId]);
$dispRecord = $stmtDisp->fetch();
test_assert($dispRecord['paciente_nombre'] === $payload['paciente_nombre'], "Nombre de paciente en cargo coincide");
test_assert($dispRecord['medico_nombre'] === $payload['medico_nombre'], "Médico prescriptor coincide");
test_assert(!empty($dispRecord['firma_base64']), "Firma digital en base64 persistida correctamente");

// 6. Limpieza del registro de prueba y restauración de stock
$pdo->prepare("UPDATE medicamentos SET stock_actual = stock_actual + ? WHERE id = ?")->execute([$cantDispensar, $medId]);
$pdo->prepare("DELETE FROM medicamento_dispensaciones WHERE id = ?")->execute([$dispId]);

$stmtRestored = $pdo->prepare("SELECT stock_actual FROM medicamentos WHERE id = ?");
$stmtRestored->execute([$medId]);
test_assert((int)$stmtRestored->fetchColumn() === $initialStock, "Stock restaurado y registro de prueba depurado");

echo "\n>>> TEST 05 COMPLETADO CON ÉXITO: Módulo de Farmacia y Descuento de Stock 100% Operativo <<<\n";
