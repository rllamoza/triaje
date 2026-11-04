<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Configuración del Sistema
// Persistencia en Base de Datos (system_settings)
// ============================================================

require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Helpers.php';

function get_default_settings(): array {
    return [
        'triajeEnabled' => false,
        'triajeOptions' => [
            'somatometria' => true,
            'signosVitales' => true,
            'oximetriaRespiracion' => true,
            'examenesAuxiliares' => true,
            'imprimirTicketTriaje' => true,
        ],
        'registroFields' => [
            'estadoCivil' => true,
            'lenguaMaterna' => true,
            'seccionResidencia' => true,
            'comunidad' => true,
            'telefono' => true,
            'altitud' => true,
            'tiempoViaje' => true,
            'seguro' => true,
            'seccionAntecedentes' => false, // Apagado por defecto según requerimiento de campaña
            'hipertension' => true,
            'diabetes' => true,
            'asma' => true,
            'anemia' => true,
            'gestante' => true,
            'alergias' => true,
        ],
        'consultaEnabled' => true,
        'farmaciaEnabled' => true,
        'branding' => [
            'appName' => 'Semilla',
            'appTagline' => 'Triaje Clínico & Campañas',
            'loginTitle' => 'PLATAFORMA CLÍNICA DE TERRENO',
            'loginSubtitle' => 'Control y triaje offline-first para brigadas rurales',
            'logoUrl' => 'https://lh3.googleusercontent.com/aida/AEtjO1WHui6EMlZ8nLYWhqM7Pt8xyBgk9V73SUi-O3GdU4QWAqyQOCDKLbzOxctZ7wZ3QiylxrmLuvQW71vVeBAssOJflzXXy76a1cXn6KwfL0JJAaxblaCy7MdqZr0BlEsQ4wKHJbGszn7p9AWkNF0LUcgBdjCcr0hKtytcRr-r3cFvcYm7_2Y7GIXLfg8IT-5Ta8t6TCqSLvT87qdOBISwCYI__NdVWoRNkfVnnJ30-vqAo6u2jU06N36Q89g_',
            'isotipoUrl' => 'https://lh3.googleusercontent.com/aida/AEtjO1WZ0tE2OVs5Sheyc4hORQ0oGj271jvC10KhuNWKN1dg5zIqDxV7G-A7uAlo05HPtzIkVbqgyemo4dRRGPbfdkGxo6aQrrKFjPQ7xIccQx8klvnBNRNPpsibPhkHx5XYAJ2HK5ZrAmfuqejPoxEsriVD84qCOv1n4wuo4x9p_qVw4BA17-e0mGJupmkTuWM5DDoVqIrv2hP_BAqGfrBHTMMhrO_vKhumJiQEyQ-oiRRi1lEDdTH5vXQOKGkS',
            'footerLeftText' => 'Soporte Técnico Satelital: +51 84 290112',
            'footerCenterText' => 'Sincronización P2P: 6 dispositivos en red local',
            'footerRightText' => 'Build v2.4.9-field',
            'footerLogoUrl' => '',
            'exportHeader' => 'ONG SEMILLA - ASISTENCIA MEDICA RURAL',
            'exportSubheader' => 'SISTEMA DE TRIAJE Y EVALUACION CLINICA AMBULATORIA',
            'exportFooterLegal' => 'Documento clínico emitido en campaña de campo. Válido para referencia hospitalaria y atención inmediata.',
            'ticketLogoUrl' => '',
            'pdfLogoUrl' => '',
            'selectedExportLogo' => 'principal',
            'ticketShowQr' => false,
            'ticketPatientFontSize' => 'grande',
            'ticketPaperWidth' => '80mm',
        ]
    ];
}

/**
 * Obtener todas las configuraciones persistidas en la BD
 */
function settings_index(): void {
    $defaults = get_default_settings();
    $db = db();

    try {
        $stmt = $db->query("SELECT `key`, `value` FROM system_settings");
        $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $result = $defaults;

        if (isset($rows['triaje_enabled'])) {
            $result['triajeEnabled'] = filter_var($rows['triaje_enabled'], FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($rows['triaje_options'])) {
            $parsed = json_decode($rows['triaje_options'], true);
            if (is_array($parsed)) {
                $result['triajeOptions'] = array_merge($defaults['triajeOptions'], $parsed);
            }
        }
        if (isset($rows['registro_fields'])) {
            $parsed = json_decode($rows['registro_fields'], true);
            if (is_array($parsed)) {
                $result['registroFields'] = array_merge($defaults['registroFields'], $parsed);
            }
        }
        if (isset($rows['consulta_enabled'])) {
            $result['consultaEnabled'] = filter_var($rows['consulta_enabled'], FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($rows['farmacia_enabled'])) {
            $result['farmaciaEnabled'] = filter_var($rows['farmacia_enabled'], FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($rows['branding'])) {
            $parsed = json_decode($rows['branding'], true);
            if (is_array($parsed)) {
                $result['branding'] = array_merge($defaults['branding'], $parsed);
            }
        }

        // Incorporar claves individuales si existen
        foreach ($rows as $k => $v) {
            $result[$k] = $v;
        }

        json_ok([
            'status' => 'success',
            'data' => $result,
        ]);
    } catch (Throwable $e) {
        json_error("Error al consultar configuraciones: " . $e->getMessage(), 500);
    }
}

/**
 * Guardar o actualizar configuraciones en la BD
 */
function settings_update(?array $user = null): void {
    $b = body();
    if (empty($b)) {
        json_error("No se recibieron datos de configuración.", 422);
    }

    $db = db();

    try {
        $upsertStmt = $db->prepare("
            INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at)
            VALUES (:key, :val, :group, :description, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                `value` = VALUES(`value`),
                `updated_at` = NOW()
        ");

        // 1. Registro fields
        if (isset($b['registroFields']) || isset($b['registro_fields'])) {
            $rf = $b['registroFields'] ?? $b['registro_fields'];
            $val = is_string($rf) ? $rf : json_encode($rf, JSON_UNESCAPED_UNICODE);
            $upsertStmt->execute([
                ':key' => 'registro_fields',
                ':val' => $val,
                ':group' => 'features',
                ':description' => 'Configuración de campos de registro de beneficiarios',
            ]);
        }

        // 2. Triaje enabled
        if (isset($b['triajeEnabled']) || isset($b['triaje_enabled'])) {
            $te = $b['triajeEnabled'] ?? $b['triaje_enabled'];
            $val = filter_var($te, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
            $upsertStmt->execute([
                ':key' => 'triaje_enabled',
                ':val' => $val,
                ':group' => 'features',
                ':description' => 'Flag de activación del módulo de triaje',
            ]);
        }

        // 3. Triaje options
        if (isset($b['triajeOptions']) || isset($b['triaje_options'])) {
            $to = $b['triajeOptions'] ?? $b['triaje_options'];
            $val = is_string($to) ? $to : json_encode($to, JSON_UNESCAPED_UNICODE);
            $upsertStmt->execute([
                ':key' => 'triaje_options',
                ':val' => $val,
                ':group' => 'features',
                ':description' => 'Opciones y campos activos del módulo de triaje',
            ]);
        }

        // 4. Consulta enabled
        if (isset($b['consultaEnabled']) || isset($b['consulta_enabled'])) {
            $ce = $b['consultaEnabled'] ?? $b['consulta_enabled'];
            $val = filter_var($ce, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
            $upsertStmt->execute([
                ':key' => 'consulta_enabled',
                ':val' => $val,
                ':group' => 'features',
                ':description' => 'Flag de activación de consulta médica',
            ]);
        }

        // 5. Farmacia enabled
        if (isset($b['farmaciaEnabled']) || isset($b['farmacia_enabled'])) {
            $fe = $b['farmaciaEnabled'] ?? $b['farmacia_enabled'];
            $val = filter_var($fe, FILTER_VALIDATE_BOOLEAN) ? 'true' : 'false';
            $upsertStmt->execute([
                ':key' => 'farmacia_enabled',
                ':val' => $val,
                ':group' => 'features',
                ':description' => 'Flag de activación de farmacia',
            ]);
        }

        // 6. Branding institucional
        if (isset($b['branding'])) {
            $br = $b['branding'];
            $val = is_string($br) ? $br : json_encode($br, JSON_UNESCAPED_UNICODE);
            $upsertStmt->execute([
                ':key' => 'branding',
                ':val' => $val,
                ':group' => 'branding',
                ':description' => 'Identidad institucional, títulos, subtítulos, logos y ticket',
            ]);
        }

        // Registrar auditoría si está disponible
        if (function_exists('audit_log') && $user) {
            audit_log('UPDATE_SYSTEM_SETTINGS', 'Configuraciones del sistema actualizadas en BD', $user['id'] ?? 1);
        }

        json_ok([
            'status' => 'success',
            'message' => 'Configuraciones persistidas correctamente en la base de datos.',
        ]);
    } catch (Throwable $e) {
        json_error("Error al persistir configuraciones: " . $e->getMessage(), 500);
    }
}
