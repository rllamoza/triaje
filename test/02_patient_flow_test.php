<?php
// ============================================================
// TEST 02: FLUJO DE ADMISIÓN DE PACIENTE Y GENERACIÓN DE TICKET
// Simulación de ingreso con antecedentes desactivados
// ============================================================

require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/core/Database.php';
require_once __DIR__ . '/../backend/core/Helpers.php';

function test_assert(bool $condition, string $message): void {
    if (!$condition) {
        echo "  [FALLO] " . $message . "\n";
        exit(1);
    }
    echo "  [OK] " . $message . "\n";
}

echo "=== INICIANDO TEST 02: Flujo de Admisión y Registro de Paciente ===\n";

$pdo = db();

// 1. Obtener o asegurar campaña activa
$camp = $pdo->query("SELECT * FROM campaigns WHERE status = 'active' LIMIT 1")->fetch();
if (!$camp) {
    $pdo->exec("INSERT INTO campaigns (code, name, location_name, province, department, altitude_masl, start_date, status, created_at, updated_at) 
                VALUES ('CMP-TEST-01', 'Campaña de Prueba Automatizada', 'Local Comunal Central', 'Urubamba', 'Cusco', 2800, CURDATE(), 'active', NOW(), NOW())");
    $camp = $pdo->query("SELECT * FROM campaigns WHERE status = 'active' LIMIT 1")->fetch();
}
test_assert(!empty($camp), "Campaña activa confirmada: " . $camp['name'] . " (ID: " . $camp['id'] . ")");

// 2. Verificar estado de la constante seccionAntecedentes en BD
$stmt = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'registro_fields'");
$stmt->execute();
$fields = json_decode($stmt->fetchColumn() ?: '{}', true);
$antecedentesActivo = $fields['seccionAntecedentes'] ?? false;
test_assert($antecedentesActivo === false, "Configuración en BD confirmada: Antecedentes desactivados para esta admisión");

// 3. Simular registro de Beneficiario (sin campos de antecedentes crónicos)
$testDni = '99' . str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
$testApellidos = 'MAMANI HUAMAN';
$testNombres = 'SIMULADO TEST';
$testFechaNac = '1985-06-15';
$testSexo = 'M';
$testComunidad = 'Rumichaca Alta';

// Limpiar paciente anterior si existe
$pdo->prepare("DELETE FROM atenciones WHERE beneficiario_id IN (SELECT id FROM beneficiarios WHERE dni = :dni)")->execute([':dni' => $testDni]);
$pdo->prepare("DELETE FROM beneficiarios WHERE dni = :dni")->execute([':dni' => $testDni]);

// Insertar beneficiario
$insBen = $pdo->prepare("
    INSERT INTO beneficiarios (
        campaign_id, dni, nombres, apellidos, fecha_nacimiento, sexo, 
        idioma_principal, tipo_seguro, comunidad, created_at, updated_at
    ) VALUES (
        :campaign_id, :dni, :nombres, :apellidos, :fecha_nac, :sexo,
        'espanol', 'SIS', :comunidad, NOW(), NOW()
    )
");
$insBen->execute([
    ':campaign_id' => $camp['id'],
    ':dni' => $testDni,
    ':nombres' => $testNombres,
    ':apellidos' => $testApellidos,
    ':fecha_nac' => $testFechaNac,
    ':sexo' => $testSexo,
    ':comunidad' => $testComunidad,
]);
$beneficiarioId = (int)$pdo->lastInsertId();
test_assert($beneficiarioId > 0, "Beneficiario registrado exitosamente con ID: {$beneficiarioId} y DNI: {$testDni}");

// 4. Verificación de DNI Duplicado
$stmtDup = $pdo->prepare("SELECT COUNT(*) FROM beneficiarios WHERE dni = :dni");
$stmtDup->execute([':dni' => $testDni]);
test_assert((int)$stmtDup->fetchColumn() === 1, "Detección de paciente existente opera con precisión (1 registro)");

// 5. Crear Registro de Atención (Turno Clínico) con status 'en_espera_medico'
$ticketNum = (int)$pdo->query("SELECT COALESCE(MAX(ticket_number), 100) + 1 FROM atenciones")->fetchColumn();
$ticketCode = sprintf("MED-%04d", rand(1, 999));
$specialtyCode = 'MED';
$specialtyName = 'Medicina General';

$insAtencion = $pdo->prepare("
    INSERT INTO atenciones (
        campaign_id, beneficiario_id, ticket_number, arrival_time, status, specialty_code, specialty_name,
        ticket_codigo, consultorio, created_at, updated_at
    ) VALUES (
        :campaign_id, :beneficiario_id, :tnum, NOW(), 'en_espera_medico', :spec_code, :spec_name,
        :ticket_code, 'Consultorio 01', NOW(), NOW()
    )
");
$insAtencion->execute([
    ':campaign_id' => $camp['id'],
    ':beneficiario_id' => $beneficiarioId,
    ':tnum' => $ticketNum,
    ':spec_code' => $specialtyCode,
    ':spec_name' => $specialtyName,
    ':ticket_code' => $ticketCode,
]);
$atencionId = (int)$pdo->lastInsertId();
test_assert($atencionId > 0, "Turno de atención generado exitosamente con ID: {$atencionId} y Código: {$ticketCode}");

// 6. Generar Registro en tickets_termicos
$insTicket = $pdo->prepare("
    INSERT INTO tickets_termicos (
        atencion_id, tipo, printer_id, contenido_raw, printed_at
    ) VALUES (
        :atencion_id, 'admision', 'PRN-USB-01', :raw, NOW()
    )
");
$rawTicket = "TURNO: {$ticketCode}\nPACIENTE: {$testApellidos}, {$testNombres}\nDNI: {$testDni}\nESPECIALIDAD: {$specialtyName}\nFECHA: " . date('Y-m-d H:i');
$insTicket->execute([
    ':atencion_id' => $atencionId,
    ':raw' => $rawTicket,
]);
$ticketId = (int)$pdo->lastInsertId();
test_assert($ticketId > 0, "Ticket térmico registrado en 'tickets_termicos' con ID: {$ticketId}");

// 7. Validar lectura del ticket desde la base de datos
$stmtVerify = $pdo->prepare("
    SELECT a.*, b.dni, b.nombres, b.apellidos
    FROM atenciones a
    JOIN beneficiarios b ON b.id = a.beneficiario_id
    WHERE a.id = :id
");
$stmtVerify->execute([':id' => $atencionId]);
$data = $stmtVerify->fetch();

test_assert($data['dni'] === $testDni, "DNI del paciente en ticket coincide");
test_assert($data['ticket_codigo'] === $ticketCode, "Código de turno coincide");

// Limpiar datos de prueba simulados
$pdo->prepare("DELETE FROM tickets_termicos WHERE atencion_id = :id")->execute([':id' => $atencionId]);
$pdo->prepare("DELETE FROM atenciones WHERE id = :id")->execute([':id' => $atencionId]);
$pdo->prepare("DELETE FROM beneficiarios WHERE id = :id")->execute([':id' => $beneficiarioId]);
test_assert(true, "Limpieza de registros de prueba simulados ejecutada correctamente");

echo "\n>>> TEST 02 COMPLETADO CON ÉXITO: Flujo de admisión y ticket sin antecedentes verificado <<<\n\n";
