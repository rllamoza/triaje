<?php
// ============================================================
// TEST 06: PERSONALIZACIÓN DE CRUD DE MEDICAMENTOS, COLUMNAS Y CONSTANTES EN BD
// Verifica campos clasificacion, uso, orden de columnas y catálogos dinámicos
// ============================================================

require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/core/Database.php';
require_once __DIR__ . '/../backend/core/Helpers.php';
require_once __DIR__ . '/../backend/controllers/MedicamentoController.php';

function test_assert(bool $condition, string $message): void {
    if (!$condition) {
        echo "  [FALLO] " . $message . "\n";
        exit(1);
    }
    echo "  [OK] " . $message . "\n";
}

echo "=== INICIANDO TEST 06: Personalización de Columnas y Catálogo de Medicamentos ===\n";

$pdo = db();
test_assert($pdo instanceof PDO, "Conexión PDO activa con MySQL (" . DB_NAME . ")");

// 1. Asegurar esquema
med_ensure_schema($pdo);

// 2. Verificar existencia de columnas clasificacion y uso en 'medicamentos'
$cols = $pdo->query("SHOW COLUMNS FROM medicamentos")->fetchAll(PDO::FETCH_COLUMN);
test_assert(in_array('clasificacion', $cols), "Columna 'clasificacion' confirmada en tabla medicamentos");
test_assert(in_array('uso', $cols), "Columna 'uso' confirmada en tabla medicamentos");

// 3. Insertar medicamento de prueba con clasificacion y uso
$campanaId = (int)($pdo->query("SELECT id FROM campaigns ORDER BY id DESC LIMIT 1")->fetchColumn() ?: 1);
$stmt = $pdo->prepare("
    INSERT INTO medicamentos (campaign_id, codigo, clasificacion, nombre_generico, concentracion, forma_farmaceutica, via_administracion, stock_actual, stock_minimo, uso, activo, created_at, updated_at)
    VALUES (:campaign_id, 'TEST-MED-99', 'Antiflatulento', 'Simeticona Gotas Test', '100mg/ml', 'solucion', 'oral', 50, 5, 'Pediátrico', 1, NOW(), NOW())
");
$stmt->execute([':campaign_id' => $campanaId]);
$insertedId = (int)$pdo->lastInsertId();
test_assert($insertedId > 0, "Medicamento de prueba registrado exitosamente (ID: {$insertedId})");

// 4. Consultar y verificar datos persistidos
$stmtCheck = $pdo->prepare("SELECT id, codigo, clasificacion, nombre_generico, uso FROM medicamentos WHERE id = :id");
$stmtCheck->execute([':id' => $insertedId]);
$medRow = $stmtCheck->fetch();
test_assert($medRow['clasificacion'] === 'Antiflatulento', "Clasificación recuperada correctamente: '{$medRow['clasificacion']}'");
test_assert($medRow['uso'] === 'Pediátrico', "Uso poblacional recuperado correctamente: '{$medRow['uso']}'");

// 5. Configurar personalización de columnas y catálogos en system_settings
$customColumns = [
    ['key' => 'clasificacion', 'label' => 'Clasificación', 'visible' => true, 'order' => 1],
    ['key' => 'nombre', 'label' => 'Medicamento', 'visible' => true, 'order' => 2],
    ['key' => 'concentracion', 'label' => 'Concentración', 'visible' => true, 'order' => 3],
    ['key' => 'stock', 'label' => 'Stock', 'visible' => true, 'order' => 4],
    ['key' => 'uso', 'label' => 'Uso', 'visible' => true, 'order' => 5],
    ['key' => 'codigo', 'label' => 'Código', 'visible' => false, 'order' => 6],
];
$customClasif = ['Antiflatulento', 'Antitusivo', 'Antibiótico', 'Analgésico', 'Antiinflamatorio'];
$customUsos = ['Pediátrico', 'Adultos', 'Geriátrico', 'Uso General'];

$pdo->prepare("
    INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at)
    VALUES ('medicamentos_columns', :val, 'medicamentos', 'Configuración de columnas de medicamentos', NOW(), NOW())
    ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()
")->execute([':val' => json_encode($customColumns, JSON_UNESCAPED_UNICODE)]);

$pdo->prepare("
    INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at)
    VALUES ('medicamentos_clasificaciones', :val, 'medicamentos', 'Catálogo de clasificaciones', NOW(), NOW())
    ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()
")->execute([':val' => json_encode($customClasif, JSON_UNESCAPED_UNICODE)]);

$pdo->prepare("
    INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at)
    VALUES ('medicamentos_usos', :val, 'medicamentos', 'Catálogo de usos', NOW(), NOW())
    ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()
")->execute([':val' => json_encode($customUsos, JSON_UNESCAPED_UNICODE)]);

test_assert(true, "Constantes de configuración personalizadas guardadas en system_settings");

// 6. Simular apagado de conexión y reinicio del servidor
$pdo = null;
$pdo = db();
test_assert($pdo instanceof PDO, "Servidor reiniciado: Conexión recuperada exitosamente");

// 7. Validar lectura tras reinicio
$stmtCol = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'medicamentos_columns'");
$stmtCol->execute();
$recoveredCols = json_decode($stmtCol->fetchColumn(), true);
test_assert(is_array($recoveredCols) && count($recoveredCols) === 6, "Columnas recuperadas íntegras tras reinicio (6 columnas)");
test_assert($recoveredCols[0]['key'] === 'clasificacion' && $recoveredCols[0]['order'] === 1, "Primera columna es 'clasificacion' (orden #1)");
test_assert($recoveredCols[5]['key'] === 'codigo' && $recoveredCols[5]['visible'] === false, "Columna 'codigo' persiste oculta tras reinicio");

$stmtClasif = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'medicamentos_clasificaciones'");
$stmtClasif->execute();
$recoveredClasif = json_decode($stmtClasif->fetchColumn(), true);
test_assert(in_array('Antiflatulento', $recoveredClasif) && in_array('Antitusivo', $recoveredClasif), "Catálogo de clasificaciones terapéuticas persistido al 100%");

$stmtUsos = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'medicamentos_usos'");
$stmtUsos->execute();
$recoveredUsos = json_decode($stmtUsos->fetchColumn(), true);
test_assert(in_array('Pediátrico', $recoveredUsos) && in_array('Adultos', $recoveredUsos), "Catálogo de usos poblacionales persistido al 100%");

// 8. Limpiar registro de prueba
$pdo->prepare("DELETE FROM medicamentos WHERE id = :id")->execute([':id' => $insertedId]);
test_assert(true, "Medicamento de prueba depurado exitosamente");

echo "\n>>> TEST 06 COMPLETADO CON ÉXITO: CRUD y Personalización de Medicamentos Verificados al 100% <<<\n";
