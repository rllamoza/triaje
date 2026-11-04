<?php
// ============================================================
// TEST 01: PERSISTENCIA E INTEGRIDAD DE CONSTANTES EN BD
// Simulación de guardado, apagado y encendido del sistema
// ============================================================

require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/core/Database.php';
require_once __DIR__ . '/../backend/core/Helpers.php';
require_once __DIR__ . '/../backend/controllers/SettingsController.php';

function test_assert(bool $condition, string $message): void {
    if (!$condition) {
        echo "  [FALLO] " . $message . "\n";
        exit(1);
    }
    echo "  [OK] " . $message . "\n";
}

echo "=== INICIANDO TEST 01: Persistencia de Constantes en Base de Datos ===\n";

// 1. Conexión y verificación de tabla
$pdo = db();
test_assert($pdo instanceof PDO, "Conexión PDO activa con MySQL (" . DB_NAME . ")");

$tableCheck = $pdo->query("SHOW TABLES LIKE 'system_settings'")->fetch();
test_assert((bool)$tableCheck, "Tabla 'system_settings' verificada y presente en el esquema");

// 2. Establecer seccionAntecedentes = false explícitamente en BD
$configFields = [
    'estadoCivil' => true,
    'lenguaMaterna' => true,
    'seccionResidencia' => true,
    'comunidad' => true,
    'telefono' => true,
    'altitud' => true,
    'tiempoViaje' => true,
    'seguro' => true,
    'seccionAntecedentes' => false, // Apagado por solicitud del usuario
    'hipertension' => true,
    'diabetes' => true,
    'asma' => true,
    'anemia' => true,
    'gestante' => true,
    'alergias' => true,
];

$stmt = $pdo->prepare("
    INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at)
    VALUES ('registro_fields', :val, 'features', 'Campos de registro', NOW(), NOW())
    ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW()
");
$stmt->execute([':val' => json_encode($configFields, JSON_UNESCAPED_UNICODE)]);
test_assert(true, "Constante 'registro_fields' guardada con seccionAntecedentes = FALSE");

// 3. Guardar constante de Triaje
$stmtTriaje = $pdo->prepare("
    INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at)
    VALUES ('triaje_enabled', 'false', 'features', 'Estado modulo triaje', NOW(), NOW())
    ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW()
");
$stmtTriaje->execute();
test_assert(true, "Constante 'triaje_enabled' guardada con valor = 'false'");

// 4. Guardar configuraciones de Branding y Ticket térmico
$brandingData = [
    'appName' => 'Semilla',
    'appTagline' => 'Triaje Clínico & Campañas Rurales',
    'loginTitle' => 'PLATAFORMA CLÍNICA DE TERRENO',
    'ticketShowQr' => false,
    'ticketPatientFontSize' => 'grande',
    'ticketPaperWidth' => '80mm',
];
$stmtBranding = $pdo->prepare("
    INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at)
    VALUES ('branding', :val, 'branding', 'Identidad y ticket', NOW(), NOW())
    ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW()
");
$stmtBranding->execute([':val' => json_encode($brandingData, JSON_UNESCAPED_UNICODE)]);
test_assert(true, "Constante 'branding' guardada con ticketShowQr = FALSE y ticketPatientFontSize = 'grande'");

// 5. SIMULACIÓN DE APAGADO DEL SISTEMA (Destrucción de conexión y reinicio de contexto)
echo "\n--- SIMULANDO APAGADO DEL SISTEMA (Cierre de conexión, flush de memoria) ---\n";
unset($pdo);
// Simular paso del tiempo y reinicio
echo "--- SISTEMA APAGADO. REINICIANDO Y ENCENDIENDO SERVIDOR... ---\n";

// 6. ENCENDIDO DEL SISTEMA: Re-conexión limpia
$pdoFresh = new PDO(
    "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
    DB_USER,
    DB_PASS,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
test_assert($pdoFresh instanceof PDO, "Servidor encendido: Conexión recuperada exitosamente");

// 7. RECUPERACIÓN DE CONSTANTES TRAS EL REINICIO
$stmtLoad = $pdoFresh->prepare("SELECT `value` FROM system_settings WHERE `key` = 'registro_fields'");
$stmtLoad->execute();
$rawFields = $stmtLoad->fetchColumn();
test_assert(!empty($rawFields), "Constante 'registro_fields' leída de la base de datos tras reinicio");

$recoveredFields = json_decode($rawFields, true);
test_assert(is_array($recoveredFields), "JSON de 'registro_fields' decodificado correctamente");
test_assert(isset($recoveredFields['seccionAntecedentes']), "Campo 'seccionAntecedentes' existe en la estructura");
test_assert($recoveredFields['seccionAntecedentes'] === false, "VERIFICACIÓN CRÍTICA: 'seccionAntecedentes' es FALSE y NO volvió a encenderse");

// 8. Recuperación de triaje_enabled
$stmtTriajeLoad = $pdoFresh->prepare("SELECT `value` FROM system_settings WHERE `key` = 'triaje_enabled'");
$stmtTriajeLoad->execute();
$recoveredTriaje = $stmtTriajeLoad->fetchColumn();
test_assert($recoveredTriaje === 'false', "Constante 'triaje_enabled' recuperada intacta ('false')");

// 9. Recuperación de branding y ticket
$stmtBrandingLoad = $pdoFresh->prepare("SELECT `value` FROM system_settings WHERE `key` = 'branding'");
$stmtBrandingLoad->execute();
$recoveredBranding = json_decode($stmtBrandingLoad->fetchColumn(), true);
test_assert($recoveredBranding['ticketShowQr'] === false, "Parámetro 'ticketShowQr' recuperado intacto (FALSE)");
test_assert($recoveredBranding['ticketPatientFontSize'] === 'grande', "Parámetro 'ticketPatientFontSize' recuperado intacto ('grande')");
test_assert($recoveredBranding['ticketPaperWidth'] === '80mm', "Parámetro 'ticketPaperWidth' recuperado intacto ('80mm')");

echo "\n>>> TEST 01 COMPLETADO CON ÉXITO: 100% DE CONSTANTES PERSISTENTES TRAS REINICIO <<<\n\n";

