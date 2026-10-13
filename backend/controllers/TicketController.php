<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Tickets Térmicos
// ============================================================

require_once __DIR__ . '/../core/ESCPOSService.php';

function ticket_get_atencion_full(int $atencionId): ?array {
    $stmt = db()->prepare("
        SELECT a.*,
               b.nombres, b.apellidos, b.dni, b.fecha_nacimiento, b.sexo, b.comunidad, b.edad_calculada,
               c.name as campaign_name,
               s.label as station_label,
               t.prioridad, t.prioridad_color, t.presion_sistolica, t.presion_diastolica,
               t.temperatura_c, t.saturacion_o2_pct, t.frecuencia_cardiaca, t.frecuencia_respiratoria, t.glucosa_mg_dl,
               co.receta,
               CONCAT(u.name, ' ', u.apellidos) as medico_nombre
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN campaigns c ON c.id = a.campaign_id
        LEFT JOIN stations s ON s.id = a.station_id
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN consultas co ON co.atencion_id = a.id
        LEFT JOIN users u ON u.id = co.medico_id
        WHERE a.id = :id
    ");
    $stmt->execute([':id' => $atencionId]);
    $row = $stmt->fetch();
    if (!$row) return null;

    $row['beneficiario'] = [
        'nombres'        => $row['nombres'],
        'apellidos'      => $row['apellidos'],
        'dni'            => $row['dni'],
        'sexo'           => $row['sexo'],
        'comunidad'      => $row['comunidad'],
        'edad_calculada' => $row['edad_calculada'],
    ];
    $row['triaje'] = [
        'prioridad'              => $row['prioridad'],
        'prioridad_color'        => $row['prioridad_color'],
        'presion_sistolica'      => $row['presion_sistolica'],
        'presion_diastolica'     => $row['presion_diastolica'],
        'temperatura_c'          => $row['temperatura_c'],
        'saturacion_o2_pct'      => $row['saturacion_o2_pct'],
        'frecuencia_cardiaca'    => $row['frecuencia_cardiaca'],
        'frecuencia_respiratoria'=> $row['frecuencia_respiratoria'],
        'glucosa_mg_dl'          => $row['glucosa_mg_dl'],
    ];
    $row['consulta'] = [
        'receta'        => !empty($row['receta']) ? json_decode($row['receta'], true) : [],
        'medico_nombre' => $row['medico_nombre'],
    ];
    return $row;
}

function tickets_generate(array $user): void {
    $b = body();
    if (empty($b['atencion_id'])) json_error("El campo 'atencion_id' es obligatorio.", 422);
    $tipo = $b['tipo'] ?? 'admision';

    $atencion = ticket_get_atencion_full((int)$b['atencion_id']);
    if (!$atencion) json_error('Atención no encontrada.', 404);

    $escpos = new ESCPOSService();
    $escposBase64 = match ($tipo) {
        'receta' => $escpos->buildRecetaTicket($atencion),
        default  => $escpos->buildAdmisionTicket($atencion),
    };

    $printResult = null;
    $isPrinted   = false;

    if (!empty($b['print_now'])) {
        $printResult = $escpos->printRaw(
            $escposBase64,
            $b['printer_id'] ?? null,
            $b['printer_ip'] ?? null
        );
        $isPrinted = !empty($printResult['success']);
    }

    $printerId = $printResult['printer'] ?? ($b['printer_id'] ?? 'EPSON TM-T88V Receipt');

    db()->prepare("
        INSERT INTO ticket_termicos (atencion_id, tipo, printer_id, escpos_base64, printed_at, printed_by, created_at, updated_at)
        VALUES (:aid, :tipo, :pid, :b64, :pat, :pby, NOW(), NOW())
    ")->execute([
        ':aid'  => $atencion['id'],
        ':tipo' => $tipo,
        ':pid'  => $printerId,
        ':b64'  => $escposBase64,
        ':pat'  => $isPrinted ? now_str() : null,
        ':pby'  => $user['id'] ?? null,
    ]);

    $ticketId = db()->lastInsertId();

    json_ok([
        'ticket_id'     => (int)$ticketId,
        'tipo'          => $tipo,
        'escpos_base64' => $escposBase64,
        'printed'       => $isPrinted,
        'print_details' => $printResult,
    ], 201);
}

function tickets_print_direct(): void {
    $b = body();
    $escpos = new ESCPOSService();
    $escposBase64 = $b['escpos_base64'] ?? null;

    if (!$escposBase64 && !empty($b['payload'])) {
        $escposBase64 = $escpos->buildTicketFromPayload($b['payload']);
    } elseif (!$escposBase64 && !empty($b['atencion_id'])) {
        $atencion = ticket_get_atencion_full((int)$b['atencion_id']);
        if ($atencion) {
            $escposBase64 = $escpos->buildAdmisionTicket($atencion);
        }
    }

    if (!$escposBase64) {
        json_error('No se proporcionaron datos para generar el ticket.', 422);
    }

    $printResult = $escpos->printRaw(
        $escposBase64,
        $b['printer_name'] ?? null,
        $b['printer_ip'] ?? null,
        (int)($b['printer_port'] ?? 9100)
    );

    json_ok($printResult, !empty($printResult['success']) ? 200 : 500);
}

function tickets_historial(int $atencionId): void {
    $stmt = db()->prepare("
        SELECT t.*, CONCAT(u.name, ' ', u.apellidos) as printed_by_name
        FROM ticket_termicos t
        LEFT JOIN users u ON u.id = t.printed_by
        WHERE t.atencion_id = :id
        ORDER BY t.created_at DESC
    ");
    $stmt->execute([':id' => $atencionId]);
    json_ok($stmt->fetchAll());
}

function tickets_printer_status(): void {
    $escpos   = new ESCPOSService();
    $printers = $escpos->getAvailablePrinters();
    $t88 = null;
    foreach ($printers as $pr) {
        if (!empty($pr['is_t88'])) { $t88 = $pr; break; }
    }

    json_ok([
        'printers'            => $printers,
        't88_detected'        => (bool)$t88,
        'recommended_printer' => $t88 ? $t88['name'] : 'EPSON TM-T88V Receipt',
        'default_port'        => $t88['port'] ?? 'ESDPRT002 (USB)',
        'status_label'        => $t88 ? $t88['status_label'] : 'Listo',
    ]);
}
