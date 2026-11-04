<?php
// ============================================================
// TEST 04: FORMATEO Y MOTOR DE TICKETS TÉRMICOS (ESC/POS)
// Verificación de centrado, legibilidad, tamaño de fuente y QR
// ============================================================

require_once __DIR__ . '/../backend/config/db.php';
require_once __DIR__ . '/../backend/core/Database.php';
require_once __DIR__ . '/../backend/core/Helpers.php';
require_once __DIR__ . '/../backend/core/ESCPOSService.php';

function test_assert(bool $condition, string $message): void {
    if (!$condition) {
        echo "  [FALLO] " . $message . "\n";
        exit(1);
    }
    echo "  [OK] " . $message . "\n";
}

echo "=== INICIANDO TEST 04: Motor de Impresión Térmica y Características de Ticket ===\n";

$pdo = db();

// 1. Cargar constantes de branding de la base de datos
$stmt = $pdo->prepare("SELECT `value` FROM system_settings WHERE `key` = 'branding'");
$stmt->execute();
$branding = json_decode($stmt->fetchColumn() ?: '{}', true);

// Asegurar valores clave
$showQr = isset($branding['ticketShowQr']) ? (bool)$branding['ticketShowQr'] : false;
$fontSize = $branding['ticketPatientFontSize'] ?? 'grande';
$paperWidth = $branding['ticketPaperWidth'] ?? '80mm';

test_assert($showQr === false, "Configuración en BD: QR oculto para comprobantes de turno");
test_assert($fontSize === 'grande' || $fontSize === 'extra-grande', "Configuración en BD: Fuente ampliada para datos del paciente ({$fontSize})");
test_assert($paperWidth === '80mm' || $paperWidth === '58mm', "Configuración en BD: Formato de papel configurado ({$paperWidth})");

// 2. Simular generación de comandos ESC/POS vía ESCPOSService
$escpos = new ESCPOSService();

// Payload con QR desactivado
$ticketData = [
    'ticket' => 'ODO-0002',
    'paciente' => 'NECIOSUP, ESTHER',
    'dni' => '40539221',
    'edad' => '42 años',
    'sexo' => 'F',
    'comunidad' => 'RUMICHACA',
    'destino' => 'Box Dental',
    'medico' => 'Médico Asignado',
    'header' => 'ONG SEMILLA - ASISTENCIA MEDICA',
    'subheader' => 'Campaña Médica Rural 2025',
    'chkQr' => $showQr, // Debe ser false
    'chkQueue' => true,
    'chkVitals' => false,
    'chkDestino' => true,
    'chkRx' => false,
];

$ticketBase64 = $escpos->buildTicketFromPayload($ticketData);
test_assert(!empty($ticketBase64), "Buffer de ticket ESC/POS generado en base64 (longitud: " . strlen($ticketBase64) . " caracteres)");

$rawBytes = base64_decode($ticketBase64);
test_assert(!empty($rawBytes), "Decodificación binaria de ticket ESC/POS exitosa (tamaño: " . strlen($rawBytes) . " bytes)");

// 3. Verificar comando de centrado geométrico y reseteo de margen (GS L 0 0)
test_assert(strpos($rawBytes, "\x1D\x4C\x00\x00") !== false, "Comando GS L 0 0 verificado para centrado geométrico perfecto");

// 4. Verificar configuración de fuente legible (Font A 12x24 dots + Doble pasada térmica)
test_assert(strpos($rawBytes, "\x1B\x4D\x00") !== false, "Comando ESC M 0 (Font A 12x24) activo para máxima legibilidad");
test_assert(strpos($rawBytes, "\x1B\x47\x01") !== false, "Comando ESC G 1 (Double strike térmico) activo para trazos oscuros y claros");

// 5. Verificar que cuando chkQr es false, no incluye comandos de código QR (GS ( k ...)
$hasQrCommand = strpos($rawBytes, "\x1D\x28\x6B") !== false;
test_assert(!$hasQrCommand, "Verificado: Comandos de código QR omitidos del ticket físico cuando ticketShowQr = FALSE");

// 6. Verificar corte de papel (GS V)
$hasCutCommand = strpos($rawBytes, "\x1D\x56") !== false;
test_assert($hasCutCommand, "Comando de corte de papel (GS V) incluido al final del ticket");

echo "\n>>> TEST 04 COMPLETADO CON ÉXITO: Motor de tickets térmicos verificado al 100% <<<\n\n";
