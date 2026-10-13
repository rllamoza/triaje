<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Atenciones
// ============================================================

function atenciones_index(): void {
    $campaignId = get_param('campaign_id');
    $status     = get_param('status');
    $date       = get_param('date');
    $page       = max(1, (int)get_param('page', 1));

    $where  = [];
    $params = [];

    if ($campaignId) { $where[] = "a.campaign_id = :cid"; $params[':cid'] = $campaignId; }
    if ($status)     { $where[] = "a.status = :status";   $params[':status'] = $status; }
    if ($date)       { $where[] = "DATE(a.arrival_time) = :date"; $params[':date'] = $date; }

    $wc  = $where ? "WHERE " . implode(' AND ', $where) : '';
    $sql = "
        SELECT a.*,
               b.nombres, b.apellidos, b.dni, b.fecha_nacimiento, b.sexo,
               t.prioridad, t.prioridad_color, t.prioridad_label,
               s.label as station_label, s.type as station_type,
               CONCAT(u.name, ' ', u.apellidos) as admitted_by_name
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN stations s ON s.id = a.station_id
        LEFT JOIN users u ON u.id = a.admitted_by
        $wc
        ORDER BY a.arrival_time DESC
    ";
    json_ok(paginate($sql, $params, 30, $page));
}

function atenciones_store(array $user): void {
    $b = body();
    $required = ['beneficiario_id', 'campaign_id'];
    foreach ($required as $f) {
        if (empty($b[$f])) json_error("El campo '$f' es obligatorio.", 422);
    }

    // Generar número de ticket
    $stmt = db()->prepare("SELECT COALESCE(MAX(ticket_number), 0) + 1 as next FROM atenciones WHERE campaign_id = :cid");
    $stmt->execute([':cid' => $b['campaign_id']]);
    $ticketNumber = (int)$stmt->fetch()['next'];

    db()->prepare("
        INSERT INTO atenciones (beneficiario_id, campaign_id, station_id, ticket_number, arrival_time, status, admitted_by, seguro_usado, created_at, updated_at)
        VALUES (:bid, :cid, :sid, :ticket, NOW(), 'admitido', :uid, :seg, NOW(), NOW())
    ")->execute([
        ':bid'    => $b['beneficiario_id'],
        ':cid'    => $b['campaign_id'],
        ':sid'    => $b['station_id'] ?? null,
        ':ticket' => $ticketNumber,
        ':uid'    => $user['id'],
        ':seg'    => $b['seguro_usado'] ?? null,
    ]);

    $atencionId = db()->lastInsertId();

    $stmt = db()->prepare("
        SELECT a.*, b.nombres, b.apellidos, b.dni, c.name as campaign_name, s.label as station_label
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN campaigns c ON c.id = a.campaign_id
        LEFT JOIN stations s ON s.id = a.station_id
        WHERE a.id = :id
    ");
    $stmt->execute([':id' => $atencionId]);
    json_ok($stmt->fetch(), 201);
}

function atenciones_show(int $id): void {
    $stmt = db()->prepare("
        SELECT a.*,
               b.nombres, b.apellidos, b.dni, b.fecha_nacimiento, b.sexo, b.celular,
               c.name as campaign_name, c.location_name,
               s.label as station_label, s.type as station_type,
               CONCAT(u.name,' ',u.apellidos) as admitted_by_name,
               t.id as triaje_id, t.prioridad, t.prioridad_color, t.prioridad_label,
               t.temperatura_c, t.presion_sistolica, t.presion_diastolica,
               t.frecuencia_cardiaca, t.saturacion_o2_pct, t.glucosa_mg_dl,
               t.peso_kg as triaje_peso, t.talla_cm as triaje_talla, t.imc as triaje_imc,
               t.motivo_consulta as triaje_motivo,
               co.id as consulta_id, co.diagnosticos, co.plan_tratamiento, co.receta, co.signed_at
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN campaigns c ON c.id = a.campaign_id
        LEFT JOIN stations s ON s.id = a.station_id
        LEFT JOIN users u ON u.id = a.admitted_by
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN consultas co ON co.atencion_id = a.id
        WHERE a.id = :id
    ");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Atención no encontrada.', 404);

    // Tickets
    $stmtT = db()->prepare("SELECT * FROM ticket_termicos WHERE atencion_id = :id ORDER BY created_at DESC");
    $stmtT->execute([':id' => $id]);
    $row['tickets'] = $stmtT->fetchAll();

    json_ok($row);
}

function atenciones_update_status(int $id): void {
    $b = body();
    $status = $b['status'] ?? '';

    $validStatuses = ['admitido','en_espera_triaje','en_triaje','en_espera_medico','en_consulta','en_farmacia','finalizado','referido','no_se_presento'];
    if (!in_array($status, $validStatuses)) {
        json_error('Estado inválido.', 422);
    }

    $set    = ['status = :status'];
    $params = [':status' => $status, ':id' => $id];

    switch ($status) {
        case 'en_triaje':        $set[] = 'triage_start_at = NOW()'; break;
        case 'en_espera_medico': $set[] = 'triage_end_at = NOW()'; break;
        case 'en_consulta':      $set[] = 'medico_start_at = NOW()'; break;
        case 'finalizado':
        case 'referido':         $set[] = 'medico_end_at = NOW()'; break;
    }

    if (!empty($b['station_id'])) {
        $set[] = 'station_id = :sid';
        $params[':sid'] = $b['station_id'];
    }

    $set[] = 'updated_at = NOW()';
    db()->prepare("UPDATE atenciones SET " . implode(', ', $set) . " WHERE id = :id")->execute($params);

    atenciones_show($id);
}

function atenciones_cola(int $campaignId): void {
    $stmt = db()->prepare("
        SELECT a.id, a.ticket_number, a.status, a.arrival_time, a.triage_start_at, a.triage_end_at,
               b.nombres, b.apellidos, b.dni, b.sexo, b.fecha_nacimiento,
               t.prioridad, t.prioridad_color, t.prioridad_label,
               s.label as station_label
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN stations s ON s.id = a.station_id
        WHERE a.campaign_id = :cid AND DATE(a.arrival_time) = CURDATE()
          AND a.status NOT IN ('finalizado','referido','no_se_presento')
        ORDER BY
            CASE t.prioridad WHEN 'I' THEN 1 WHEN 'II' THEN 2 ELSE 3 END,
            a.arrival_time ASC
    ");
    $stmt->execute([':cid' => $campaignId]);
    json_ok([
        'queue'     => $stmt->fetchAll(),
        'timestamp' => date('c'),
    ]);
}

function atenciones_cola_live(int $campaignId): never {
    // Server-Sent Events (SSE)
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('X-Accel-Buffering: no');

    while (true) {
        $stmt = db()->prepare("
            SELECT a.id, a.ticket_number, a.status, a.arrival_time,
                   b.nombres, b.apellidos, b.dni,
                   t.prioridad, t.prioridad_color
            FROM atenciones a
            LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
            LEFT JOIN triajes t ON t.atencion_id = a.id
            WHERE a.campaign_id = :cid AND DATE(a.arrival_time) = CURDATE()
              AND a.status NOT IN ('finalizado','referido','no_se_presento')
            ORDER BY CASE t.prioridad WHEN 'I' THEN 1 WHEN 'II' THEN 2 ELSE 3 END, a.arrival_time ASC
        ");
        $stmt->execute([':cid' => $campaignId]);
        $data = json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
        echo "data: $data\n\n";
        if (ob_get_level()) { ob_flush(); }
        flush();
        sleep(10);
        if (connection_aborted()) break;
    }
    exit;
}
