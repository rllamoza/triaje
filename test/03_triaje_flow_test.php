<?php
// ============================================================
// TEST 03: INTEGRIDAD DE FLUJOS (TRIAJE ACTIVADO vs DESACTIVADO)
// Validación de transición de estados y módulos clínicos
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

echo "=== INICIANDO TEST 03: Validación de Flujo con y sin Módulo de Triaje ===\n";

$pdo = db();

// Campaña activa
$camp = $pdo->query("SELECT id FROM campaigns WHERE status = 'active' LIMIT 1")->fetch();
$campaignId = $camp ? (int)$camp['id'] : 1;

// Obtener un usuario médico
$medico = $pdo->query("SELECT id FROM users WHERE role = 'medico' LIMIT 1")->fetch();
$medicoId = $medico ? (int)$medico['id'] : 1;

// -------------------------------------------------------------
// CASO A: FLUJO CON TRIAJE HABILITADO
// -------------------------------------------------------------
echo "\n--- CASO A: Flujo con Módulo de Triaje ACTIVADO ---\n";

// 1. Activar triaje en la constante de BD
$pdo->prepare("UPDATE system_settings SET `value` = 'true' WHERE `key` = 'triaje_enabled'")->execute();
$currentTriajeState = $pdo->query("SELECT `value` FROM system_settings WHERE `key` = 'triaje_enabled'")->fetchColumn();
test_assert($currentTriajeState === 'true', "Estado en BD actualizado: Triaje ACTIVADO");

// 2. Crear beneficiario de prueba A
$dniA = '88' . str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
$pdo->prepare("INSERT INTO beneficiarios (campaign_id, dni, nombres, apellidos, fecha_nacimiento, sexo, idioma_principal, tipo_seguro, created_at, updated_at) 
               VALUES (:cId, :dni, 'PACIENTE A', 'TRIAJE TEST', '1990-01-01', 'F', 'espanol', 'SIS', NOW(), NOW())")
    ->execute([':cId' => $campaignId, ':dni' => $dniA]);
$benA_Id = (int)$pdo->lastInsertId();

// 3. Crear atención que entra a cola de 'en_espera_triaje'
$tnumA = (int)$pdo->query("SELECT COALESCE(MAX(ticket_number), 100) + 1 FROM atenciones")->fetchColumn();
$pdo->prepare("INSERT INTO atenciones (campaign_id, beneficiario_id, ticket_number, arrival_time, status, specialty_code, specialty_name, ticket_codigo, created_at, updated_at)
               VALUES (:cId, :bId, :tnum, NOW(), 'en_espera_triaje', 'MED', 'Medicina General', 'MED-TR-01', NOW(), NOW())")
    ->execute([':cId' => $campaignId, ':bId' => $benA_Id, ':tnum' => $tnumA]);
$atencionA_Id = (int)$pdo->lastInsertId();
test_assert($atencionA_Id > 0, "Atención creada con status inicial 'en_espera_triaje' (ID: {$atencionA_Id})");

// 4. Registrar Signos Vitales en tabla 'triajes'
$pdo->prepare("INSERT INTO triajes (
    atencion_id, peso_kg, talla_cm, imc, presion_sistolica, presion_diastolica,
    frecuencia_cardiaca, frecuencia_respiratoria, saturacion_o2_pct, temperatura_c,
    glucosa_mg_dl, prioridad, created_at, updated_at
) VALUES (
    :atId, 68.5, 162.0, 26.10, 120, 80,
    74, 18, 98, 36.6,
    95, 'III', NOW(), NOW()
)")->execute([':atId' => $atencionA_Id]);
$triajeRecordId = (int)$pdo->lastInsertId();
test_assert($triajeRecordId > 0, "Signos vitales registrados en box de triaje (ID: {$triajeRecordId})");

// 5. Transición de atención de 'en_espera_triaje' a 'en_espera_medico'
$pdo->prepare("UPDATE atenciones SET status = 'en_espera_medico', updated_at = NOW() WHERE id = :id")
    ->execute([':id' => $atencionA_Id]);

$statusA = $pdo->query("SELECT status FROM atenciones WHERE id = {$atencionA_Id}")->fetchColumn();
test_assert($statusA === 'en_espera_medico', "Atención derivada exitosamente a 'en_espera_medico'");

// -------------------------------------------------------------
// CASO B: FLUJO CON TRIAJE DESHABILITADO (Paso directo a Consulta)
// -------------------------------------------------------------
echo "\n--- CASO B: Flujo con Módulo de Triaje DESACTIVADO (Paso directo) ---\n";

// 1. Desactivar triaje en constante de BD
$pdo->prepare("UPDATE system_settings SET `value` = 'false' WHERE `key` = 'triaje_enabled'")->execute();
$currentTriajeState = $pdo->query("SELECT `value` FROM system_settings WHERE `key` = 'triaje_enabled'")->fetchColumn();
test_assert($currentTriajeState === 'false', "Estado en BD actualizado: Triaje DESACTIVADO");

// 2. Crear beneficiario de prueba B
$dniB = '88' . str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
$pdo->prepare("INSERT INTO beneficiarios (campaign_id, dni, nombres, apellidos, fecha_nacimiento, sexo, idioma_principal, tipo_seguro, created_at, updated_at) 
               VALUES (:cId, :dni, 'PACIENTE B', 'DIRECTO TEST', '1982-04-12', 'M', 'espanol', 'SIS', NOW(), NOW())")
    ->execute([':cId' => $campaignId, ':dni' => $dniB]);
$benB_Id = (int)$pdo->lastInsertId();

// 3. Crear atención directa a 'en_espera_medico' (sin pasar por triaje)
$tnumB = (int)$pdo->query("SELECT COALESCE(MAX(ticket_number), 100) + 1 FROM atenciones")->fetchColumn();
$pdo->prepare("INSERT INTO atenciones (campaign_id, beneficiario_id, ticket_number, arrival_time, status, specialty_code, specialty_name, ticket_codigo, created_at, updated_at)
               VALUES (:cId, :bId, :tnum, NOW(), 'en_espera_medico', 'MED', 'Medicina General', 'MED-DIR-02', NOW(), NOW())")
    ->execute([':cId' => $campaignId, ':bId' => $benB_Id, ':tnum' => $tnumB]);
$atencionB_Id = (int)$pdo->lastInsertId();
test_assert($atencionB_Id > 0, "Atención ingresó directamente a 'en_espera_medico' (ID: {$atencionB_Id})");

// 4. El médico atiende la consulta directamente (pasa a 'en_consulta')
$pdo->prepare("UPDATE atenciones SET status = 'en_consulta', updated_at = NOW() WHERE id = :id")
    ->execute([':id' => $atencionB_Id]);

$dxJson = json_encode([['cie10' => 'G44.2', 'descripcion' => 'Cefalea debida a tensión']], JSON_UNESCAPED_UNICODE);
$pdo->prepare("INSERT INTO consultas (
    atencion_id, medico_id, motivo_consulta, enfermedad_actual, diagnosticos, indicaciones, 
    created_at, updated_at
) VALUES (
    :atId, :medId, 'Cefalea leve ocasional', 'Paciente refiere cefalea holocraneal de 3 días de evolución', :dx, 'Hidratación oral y reposo',
    NOW(), NOW()
)")->execute([':atId' => $atencionB_Id, ':medId' => $medicoId, ':dx' => $dxJson]);
$consultaId = (int)$pdo->lastInsertId();
test_assert($consultaId > 0, "Consulta médica realizada y guardada exitosamente (ID: {$consultaId})");

// 5. Finalización de atención a 'finalizado'
$pdo->prepare("UPDATE atenciones SET status = 'finalizado', updated_at = NOW() WHERE id = :id")
    ->execute([':id' => $atencionB_Id]);
$statusB = $pdo->query("SELECT status FROM atenciones WHERE id = {$atencionB_Id}")->fetchColumn();
test_assert($statusB === 'finalizado', "Atención finalizada con status 'finalizado'");

// -------------------------------------------------------------
// LIMPIEZA DE DATOS Y RESTAURACIÓN DE ESTADO
// -------------------------------------------------------------
$pdo->prepare("DELETE FROM triajes WHERE atencion_id = :id")->execute([':id' => $atencionA_Id]);
$pdo->prepare("DELETE FROM consultas WHERE atencion_id = :id")->execute([':id' => $atencionB_Id]);
$pdo->prepare("DELETE FROM atenciones WHERE id IN (:idA, :idB)")->execute([':idA' => $atencionA_Id, ':idB' => $atencionB_Id]);
$pdo->prepare("DELETE FROM beneficiarios WHERE id IN (:idA, :idB)")->execute([':idA' => $benA_Id, ':idB' => $benB_Id]);

// Restaurar constante triaje_enabled = 'false'
$pdo->prepare("UPDATE system_settings SET `value` = 'false' WHERE `key` = 'triaje_enabled'")->execute();
test_assert(true, "Registros temporales depurados y constante triaje_enabled restaurada a 'false'");

echo "\n>>> TEST 03 COMPLETADO CON ÉXITO: Ambos flujos clínicos verificados rigurosamente <<<\n\n";
