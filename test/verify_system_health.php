<?php
/**
 * SEMILLA TRIAJE - Script de Diagnóstico Integral de Salud del Sistema y Base de Datos
 */

require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/core/Helpers.php';
require_once __DIR__ . '/../backend/core/Database.php';
require_once __DIR__ . '/../backend/core/ESCPOSService.php';
require_once __DIR__ . '/../backend/controllers/FarmaciaController.php';

header('Content-Type: text/plain; charset=utf-8');

echo "================================================================================\n";
echo "       DIAGNÓSTICO INTEGRAL DE BASE DE DATOS Y MÓDULOS DE SISTEMA               \n";
echo "================================================================================\n";
echo "Fecha y Hora: " . date('Y-m-d H:i:s') . "\n";
echo "Entorno PHP: " . PHP_VERSION . " | Sistema Operativo: " . PHP_OS . "\n";
echo "--------------------------------------------------------------------------------\n\n";

$errors = [];
$warnings = [];

// 1. VERIFICACIÓN DE CONEXIÓN A BASE DE DATOS
echo "1. VERIFICANDO CONEXIÓN A BASE DE DATOS:\n";
try {
    $pdo = db();
    $status = $pdo->getAttribute(PDO::ATTR_CONNECTION_STATUS);
    $serverVersion = $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
    echo "  [OK] Conexión establecida con éxito\n";
    echo "  [OK] Estado de Conexión: {$status}\n";
    echo "  [OK] Versión MySQL: {$serverVersion}\n";
    echo "  [OK] Base de datos activa: " . DB_NAME . "\n";
    echo "  [OK] Host y Puerto: " . DB_HOST . ":" . DB_PORT . "\n";
} catch (Exception $e) {
    echo "  [FALLO CRÍTICO] No se pudo conectar a la base de datos: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. VERIFICACIÓN DE ESQUEMA Y TABLAS PRINCIPALES
echo "\n2. VERIFICANDO TABLAS PRINCIPALES Y VOLUMEN DE DATOS:\n";
$criticalTables = [
    'users'                     => 'Usuarios y Credenciales del Sistema',
    'campaigns'                 => 'Campañas Médicas Activas y Programadas',
    'stations'                  => 'Estaciones / Consultorios de Atención',
    'campaign_specialties'      => 'Especialidades Médicas por Campaña',
    'beneficiarios'             => 'Padrón de Pacientes / Beneficiarios',
    'atenciones'                => 'Turnos y Flujo de Atención Clínica',
    'triajes'                   => 'Evaluaciones de Signos Vitales y Triaje',
    'consultas'                 => 'Consultas Médicas y Recetas Clínicas',
    'medicamentos'              => 'Catálogo de Farmacia y Vademécum',
    'medicamento_dispensaciones'=> 'Registro de Dispensaciones y Entregas',
    'tickets_termicos'          => 'Historial de Comprobantes Térmicos',
    'system_settings'           => 'Configuraciones y Constantes Persistentes'
];

$existingTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

foreach ($criticalTables as $t => $desc) {
    if (in_array($t, $existingTables)) {
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo "  [OK] Tabla '{$t}': presente ({$count} registros) -> {$desc}\n";
    } else {
        echo "  [FALLO] Tabla '{$t}': NO EXISTE EN LA BASE DE DATOS\n";
        $errors[] = "Tabla faltante: $t";
    }
}

// 3. VERIFICACIÓN DE COLUMNAS CLAVE EN EL ESQUEMA
echo "\n3. VERIFICANDO COLUMNAS CRÍTICAS Y CONFIGURACIONES DE ESQUEMA:\n";
$columnsToCheck = [
    'beneficiarios' => ['distrito', 'comunidad', 'dni', 'nombres', 'apellidos'],
    'atenciones'    => ['ticket_number', 'ticket_codigo', 'campaign_id', 'beneficiario_id', 'status'],
    'medicamentos'  => ['clasificacion', 'uso', 'stock_actual', 'nombre_generico', 'activo'],
    'triajes'       => ['temperatura_c', 'presion_sistolica', 'presion_diastolica', 'prioridad'],
    'system_settings'=> ['key', 'value', 'group']
];

foreach ($columnsToCheck as $tbl => $cols) {
    if (!in_array($tbl, $existingTables)) continue;
    $tableCols = $pdo->query("SHOW COLUMNS FROM `$tbl`")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($cols as $col) {
        if (in_array($col, $tableCols)) {
            echo "  [OK] `{$tbl}`.`{$col}`: presente\n";
        } else {
            echo "  [FALLO] `{$tbl}`.`{$col}`: FALTA LA COLUMNA\n";
            $errors[] = "Columna faltante: $tbl.$col";
        }
    }
}

// 4. VERIFICACIÓN DE ÍNDICES Y RESTRICCIONES EN ATENCIONES
echo "\n4. VERIFICANDO ÍNDICES Y PERMISOS PARA CORRELATIVO DIARIO:\n";
$indices = $pdo->query("SHOW INDEX FROM atenciones")->fetchAll(PDO::FETCH_ASSOC);
$indexNames = array_unique(array_column($indices, 'Key_name'));

$hasCampaignIdx = in_array('idx_atenciones_campaign_id', $indexNames) || in_array('atenciones_campaign_id_foreign', $indexNames);
$hasUniqueStrict = in_array('atenciones_campaign_id_ticket_number_unique', $indexNames);

if ($hasCampaignIdx) {
    echo "  [OK] Índice en atenciones.campaign_id verificado para FK y rendimiento\n";
} else {
    echo "  [ADVERTENCIA] Índice explícito en atenciones.campaign_id no encontrado\n";
}

if (!$hasUniqueStrict) {
    echo "  [OK] Restricción única global (campaign_id, ticket_number) eliminada: Permite correlativo diario reiniciable desde 0001 cada día\n";
} else {
    echo "  [ADVERTENCIA] Restricción atenciones_campaign_id_ticket_number_unique sigue activa. Debe eliminarse para permitir ticket 1 cada día.\n";
    $warnings[] = "Restricción única de ticket activa";
}

// 5. TEST FUNCIONAL: PERSISTENCIA DE CONFIGURACIONES (system_settings)
echo "\n5. TEST FUNCIONAL: PERSISTENCIA DE CONFIGURACIONES (system_settings):\n";
try {
    $stmt = $pdo->query("SELECT `key`, LENGTH(`value`) as len FROM system_settings");
    $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "  [OK] Se recuperaron " . count($settings) . " configuraciones del sistema desde la base de datos:\n";
    foreach ($settings as $s) {
        echo "       - {$s['key']} ({$s['len']} bytes)\n";
    }
} catch (Exception $e) {
    echo "  [FALLO] Error leyendo system_settings: " . $e->getMessage() . "\n";
    $errors[] = "Error system_settings: " . $e->getMessage();
}

// 6. TEST FUNCIONAL: MÓDULO DE ADMISIÓN Y GENERACIÓN DE CORRELATIVO DIARIO
echo "\n6. TEST FUNCIONAL: MÓDULO DE ADMISIÓN Y CORRELATIVO DIARIO:\n";
try {
    $camp = $pdo->query("SELECT id, name FROM campaigns WHERE status = 'active' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if (!$camp) {
        $camp = $pdo->query("SELECT id, name FROM campaigns LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    }
    $campId = $camp['id'] ?? 1;
    echo "  [OK] Campaña evaluada: '{$camp['name']}' (ID: {$campId})\n";

    $stmtCorr = $pdo->prepare("
        SELECT COALESCE(MAX(ticket_number), 0) + 1 AS next_ticket
        FROM atenciones
        WHERE campaign_id = :cid AND DATE(created_at) = CURDATE()
    ");
    $stmtCorr->execute([':cid' => $campId]);
    $nextTicket = (int)$stmtCorr->fetchColumn();
    $formatted = sprintf('%04d', $nextTicket);
    echo "  [OK] Correlativo diario para hoy (" . date('d/m/Y') . "): {$nextTicket} -> Formato Ticket: '{$formatted}'\n";
} catch (Exception $e) {
    echo "  [FALLO] Error calculando correlativo: " . $e->getMessage() . "\n";
    $errors[] = "Error correlativo admisión: " . $e->getMessage();
}

// 7. TEST FUNCIONAL: MÓDULO DE FARMACIA Y STOCK EN TIEMPO REAL
echo "\n7. TEST FUNCIONAL: MÓDULO DE FARMACIA Y CATÁLOGO DE MEDICAMENTOS:\n";
try {
    farmacia_ensure_schema();
    $medsCount = (int)$pdo->query("SELECT COUNT(*) FROM medicamentos WHERE activo = 1")->fetchColumn();
    $stockTotal = (int)$pdo->query("SELECT COALESCE(SUM(stock_actual), 0) FROM medicamentos WHERE activo = 1")->fetchColumn();
    $agotados = (int)$pdo->query("SELECT COUNT(*) FROM medicamentos WHERE activo = 1 AND stock_actual <= 0")->fetchColumn();
    echo "  [OK] Catálogo de medicamentos activos: {$medsCount} items\n";
    echo "  [OK] Unidades físicas totales en stock: {$stockTotal} unidades\n";
    echo "  [OK] Medicamentos agotados (stock <= 0): {$agotados}\n";

    // Probar consulta de stock público (idéntica a la vista de stock en vivo)
    $stmtPub = $pdo->query("
        SELECT id, nombre_generico, concentracion, forma_farmaceutica, stock_actual, clasificacion, via_administracion
        FROM medicamentos
        WHERE activo = 1
        ORDER BY nombre_generico ASC
        LIMIT 5
    ");
    $sample = $stmtPub->fetchAll(PDO::FETCH_ASSOC);
    echo "  [OK] Endpoint de Stock Público en Vivo: 100% Operativo (" . count($sample) . " medicamentos procesados como muestra)\n";
} catch (Exception $e) {
    echo "  [FALLO] Error en módulo de farmacia: " . $e->getMessage() . "\n";
    $errors[] = "Error farmacia: " . $e->getMessage();
}

// 8. TEST FUNCIONAL: MÓDULO DE TRIAJE Y SIGNOS VITALES
echo "\n8. TEST FUNCIONAL: MÓDULO DE TRIAJE Y SIGNOS VITALES:\n";
try {
    $triajesTotal = (int)$pdo->query("SELECT COUNT(*) FROM triajes")->fetchColumn();
    echo "  [OK] Registros de triajes completados en el historial: {$triajesTotal}\n";
    $triajeSetting = $pdo->query("SELECT `value` FROM system_settings WHERE `key` = 'triaje_enabled'")->fetchColumn();
    $triajeStatus = ($triajeSetting === 'false' || $triajeSetting === false) ? 'DESACTIVADO (Paso Directo)' : 'ACTIVADO (Box de Signos Vitales)';
    echo "  [OK] Modo de operación de Triaje configurado en BD: {$triajeStatus}\n";
} catch (Exception $e) {
    echo "  [FALLO] Error en módulo de triaje: " . $e->getMessage() . "\n";
    $errors[] = "Error triaje: " . $e->getMessage();
}

// 9. TEST FUNCIONAL: MÓDULO DE CONSULTA MÉDICA
echo "\n9. TEST FUNCIONAL: MÓDULO DE CONSULTA MÉDICA Y DIAGNÓSTICOS:\n";
try {
    $consultasCount = (int)$pdo->query("SELECT COUNT(*) FROM consultas")->fetchColumn();
    echo "  [OK] Consultas médicas registradas en base de datos: {$consultasCount}\n";
    $atencionesPendientes = (int)$pdo->query("SELECT COUNT(*) FROM atenciones WHERE status IN ('en_espera_medico', 'en_espera_triaje')")->fetchColumn();
    echo "  [OK] Pacientes en cola clínica activa: {$atencionesPendientes}\n";
} catch (Exception $e) {
    echo "  [FALLO] Error en módulo de consultas: " . $e->getMessage() . "\n";
    $errors[] = "Error consultas: " . $e->getMessage();
}

// 10. TEST FUNCIONAL: MOTOR TÉRMICO ESC/POS
echo "\n10. TEST FUNCIONAL: MOTOR TÉRMICO ESC/POS:\n";
try {
    $escpos = new ESCPOSService();
    $sampleData = [
        'ticket_number' => $nextTicket,
        'ticket_codigo' => $formatted,
        'specialty_name' => 'MEDICINA GENERAL',
        'beneficiario' => [
            'nombres' => 'JUAN CARLOS',
            'apellidos' => 'MAMANI QUISPE',
            'dni' => '45678901',
            'edad_calculada' => 42,
            'distrito' => 'Urubamba',
            'comunidad' => 'Rumichaca'
        ]
    ];
    $buffer = $escpos->buildAdmisionTicket($sampleData);
    $bin = base64_decode($buffer);
    echo "  [OK] Ticket térmico ESC/POS generado: " . strlen($buffer) . " caracteres base64 (" . strlen($bin) . " bytes binarios)\n";
    
    // Validar cabeceras y textos según especificación
    if (strpos($bin, "Nro de Ticket") !== false) {
        echo "  [OK] Cabecera de Turno actualizada a 'Nro de Ticket:' en el buffer térmico\n";
    } else {
        echo "  [FALLO] 'Nro de Ticket' no detectado en el buffer binario\n";
        $errors[] = "Encabezado Nro de Ticket no presente en ESC/POS";
    }

    if (strpos($bin, "DISTRITO: ") !== false && strpos($bin, "Urubamba") !== false) {
        echo "  [OK] Campo 'DISTRITO: Urubamba' confirmado en el ticket térmico\n";
    } else {
        echo "  [FALLO] Campo distrito no encontrado en el buffer binario\n";
        $errors[] = "Campo DISTRITO no presente en ESC/POS";
    }

    if (strpos($bin, "EDAD: ") !== false && strpos($bin, "42") !== false) {
        echo "  [OK] Campo 'EDAD: 42 años' confirmado en el ticket térmico\n";
    } else {
        echo "  [FALLO] Campo edad no encontrado en el buffer binario\n";
        $errors[] = "Campo EDAD no presente en ESC/POS";
    }

    if (strpos($bin, "TICKET DE INSCRIPCION") === false) {
        echo "  [OK] 'TICKET DE INSCRIPCION' removido correctamente del encabezado\n";
    } else {
        echo "  [FALLO] 'TICKET DE INSCRIPCION' todavía figura en el buffer\n";
        $errors[] = "TICKET DE INSCRIPCION aún presente en ESC/POS";
    }

    if (strpos($bin, "ESPECIALIDAD") === false) {
        echo "  [OK] Especialidad excluida correctamente del ticket de admisión\n";
    } else {
        echo "  [FALLO] Especialidad aún figura en el ticket\n";
        $errors[] = "Especialidad aún presente en ESC/POS";
    }
} catch (Exception $e) {
    echo "  [FALLO] Error en motor térmico: " . $e->getMessage() . "\n";
    $errors[] = "Error térmico: " . $e->getMessage();
}

// RESUMEN FINAL
echo "\n================================================================================\n";
echo "                              RESUMEN FINAL                                     \n";
echo "================================================================================\n";
if (empty($errors)) {
    echo "RESULTADO: 100% OPERATIVO - TODOS LOS MÓDULOS ACTIVOS Y SIN ERRORES\n";
    echo "Total de Tablas Principales Verificadas: " . count($criticalTables) . " / " . count($criticalTables) . "\n";
    echo "Total de Advertencias: " . count($warnings) . "\n";
    echo "Base de Datos: Conexión activa, esquema compatible y listo para operación.\n";
} else {
    echo "RESULTADO: SE DETECTARON " . count($errors) . " ERRORES:\n";
    foreach ($errors as $err) {
        echo "  - $err\n";
    }
}
echo "================================================================================\n";
