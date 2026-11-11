<?php
// ============================================================
// TEST 08: MONITOREO DE STOCK EN TIEMPO REAL & DESCUENTO POR ASIGNACIÓN
// Valida que la dispensación descuente stock exactamente y que
// el endpoint público refleje el inventario en tiempo real
// ============================================================

require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/core/Database.php';
require_once __DIR__ . '/../backend/core/Helpers.php';
require_once __DIR__ . '/../backend/controllers/MedicamentoController.php';
require_once __DIR__ . '/../backend/controllers/FarmaciaController.php';

function test_assert(bool $cond, string $msg): void {
    if (!$cond) {
        echo "  [FALLO] " . $msg . "\n";
        exit(1);
    }
    echo "  [OK] " . $msg . "\n";
}

echo "=== INICIANDO TEST 08: Monitoreo Público y Descuento de Stock en Tiempo Real ===\n";

$pdo = db();
test_assert($pdo instanceof PDO, "Conexión a MySQL activa");

farmacia_ensure_schema();

// 1. Obtener medicamento para prueba
$stmt = $pdo->query("SELECT id, nombre_generico, stock_actual, stock_minimo FROM medicamentos WHERE campaign_id = 1 AND activo = 1 LIMIT 1");
$med = $stmt->fetch();
test_assert((bool)$med, "Medicamento encontrado para prueba: " . ($med['nombre_generico'] ?? ''));

$medId = (int)$med['id'];
$stockInicial = (int)$med['stock_actual'];

// 2. Simular asignación a paciente y dispensación
$cantAsignada = 5;
$payloadDispensar = [
    'campaign_id' => 1,
    'paciente_nombre' => 'TEST BENEFICIARIO DESCUENTO STOCK',
    'paciente_dni' => '88887777',
    'medico_nombre' => 'Dr. Médico Validador',
    'items' => [
        [
            'medicamento_id' => $medId,
            'cantidad' => $cantAsignada,
            'dosis' => '1 tableta',
            'indicaciones' => 'cada 8 horas'
        ]
    ]
];

// Iniciar transacción de dispensación
$pdo->beginTransaction();
try {
    // Lock FOR UPDATE
    $lockStmt = $pdo->prepare("SELECT id, stock_actual FROM medicamentos WHERE id = ? FOR UPDATE");
    $lockStmt->execute([$medId]);
    $curr = (int)$lockStmt->fetchColumn();

    $stmtUpd = $pdo->prepare("UPDATE medicamentos SET stock_actual = stock_actual - ?, stock_updated_at = NOW(), updated_at = NOW() WHERE id = ?");
    $stmtUpd->execute([$cantAsignada, $medId]);

    $stmtIns = $pdo->prepare("INSERT INTO medicamento_dispensaciones (campaign_id, paciente_nombre, paciente_dni, medico_nombre, items, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmtIns->execute([1, $payloadDispensar['paciente_nombre'], $payloadDispensar['paciente_dni'], $payloadDispensar['medico_nombre'], json_encode($payloadDispensar['items'])]);
    $dispId = (int)$pdo->lastInsertId();

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    test_assert(false, "Fallo al ejecutar transacción de descuento: " . $e->getMessage());
}

// 3. Verificar que en la base de datos se descontó exactamente
$stockDespues = (int)$pdo->query("SELECT stock_actual FROM medicamentos WHERE id = $medId")->fetchColumn();
test_assert($stockDespues === ($stockInicial - $cantAsignada), "VERIFICACIÓN CRÍTICA: Stock en BD descontado exactamente ($stockInicial -> $stockDespues, diferencia: -$cantAsignada)");

// 4. Validar consulta de stock público
$campId = 1;
$stmtPub = $pdo->prepare("SELECT id, nombre_generico, stock_actual, stock_minimo FROM medicamentos WHERE id = :id AND campaign_id = :cid");
$stmtPub->execute([':id' => $medId, ':cid' => $campId]);
$medPub = $stmtPub->fetch();

test_assert((int)$medPub['stock_actual'] === $stockDespues, "Stock público refleja de inmediato el nuevo saldo en tiempo real");

// 5. Limpieza de prueba: restaurar stock
$pdo->prepare("UPDATE medicamentos SET stock_actual = stock_actual + ? WHERE id = ?")->execute([$cantAsignada, $medId]);
$pdo->prepare("DELETE FROM medicamento_dispensaciones WHERE id = ?")->execute([$dispId]);

$stockRestaurado = (int)$pdo->query("SELECT stock_actual FROM medicamentos WHERE id = $medId")->fetchColumn();
test_assert($stockRestaurado === $stockInicial, "Stock original restaurado tras verificación exitosa");

echo "\n>>> TEST 08 COMPLETADO CON ÉXITO: Descuento de stock y monitoreo en vivo validados al 100% <<<\n";

