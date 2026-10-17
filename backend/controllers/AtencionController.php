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
               b.nombres, b.apellidos, b.dni, b.fecha_nacimiento, b.sexo, b.celular, b.comunidad, b.edad_calculada, b.tipo_seguro, b.altitud_residencia, b.idioma_principal,
               t.id as triaje_id, t.prioridad, t.prioridad_color, t.prioridad_label,
               t.temperatura_c, t.presion_sistolica, t.presion_diastolica,
               t.frecuencia_cardiaca, t.frecuencia_respiratoria, t.saturacion_o2_pct, t.saturacion_corregida, t.glucosa_mg_dl,
               t.peso_kg as triaje_peso, t.talla_cm as triaje_talla, t.imc as triaje_imc,
               t.sintoma_principal as triaje_sintoma, t.alergias_activas as triaje_alergias,
               t.observaciones_triaje, t.motivo_consulta as triaje_motivo,
               s.label as station_label, s.type as station_type,
               CONCAT(u.name, ' ', u.apellidos) as admitted_by_name,
               CONCAT(um.name, ' ', um.apellidos) as medico_asignado_nombre
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN stations s ON s.id = a.station_id
        LEFT JOIN users u ON u.id = a.admitted_by
        LEFT JOIN users um ON um.id = a.medico_id
        $wc
        ORDER BY a.arrival_time DESC
    ";
    $perPage = min(200, max(10, (int)get_param('per_page', 30)));
    json_ok(paginate($sql, $params, $perPage, $page));
}

function atenciones_store(array $user): void {
    $b = body();
    $cid = (int)($b['campaign_id'] ?? 1);
    $bid = (int)($b['beneficiario_id'] ?? 0);
    if ($bid <= 0) json_error("El campo 'beneficiario_id' es obligatorio y debe ser numérico.", 422);

    // Asegurar que el beneficiario exista para no violar la llave foránea
    $beneCheck = db()->prepare("SELECT id FROM beneficiarios WHERE id = :bid LIMIT 1");
    $beneCheck->execute([':bid' => $bid]);
    if (!$beneCheck->fetch()) {
        json_error("El paciente indicado (ID: $bid) no existe en el padrón de beneficiarios.", 404);
    }

    // Asegurar que la campaña exista
    $campCheck = db()->prepare("SELECT id FROM campaigns WHERE id = :cid LIMIT 1");
    $campCheck->execute([':cid' => $cid]);
    if (!$campCheck->fetch()) {
        $firstCamp = db()->query("SELECT id FROM campaigns ORDER BY id ASC LIMIT 1")->fetch();
        if ($firstCamp) {
            $cid = (int)$firstCamp['id'];
        } else {
            db()->exec("INSERT INTO campaigns (id, code, name, location_name, province, department, altitude_masl, start_date, status, created_at, updated_at) VALUES (1, 'CMP-2025-CUS-02', 'Cusco - Valle Sagrado 2025', 'Salon Comunal Rumichaca', 'Urubamba', 'Cusco', 2870, CURDATE(), 'active', NOW(), NOW())");
            $cid = 1;
        }
    }

    // Asegurar que el usuario admision exista (o NULL para no romper la FK)
    $admittedBy = null;
    if (!empty($user['id'])) {
        $uCheck = db()->prepare("SELECT id FROM users WHERE id = :uid LIMIT 1");
        $uCheck->execute([':uid' => $user['id']]);
        if ($uCheck->fetch()) {
            $admittedBy = (int)$user['id'];
        }
    }

    // Specialty selection
    $spCode = strtoupper(trim($b['specialty_code'] ?? ''));
    if (empty($spCode)) {
        try {
            $firstSp = db()->prepare("SELECT * FROM campaign_specialties WHERE campaign_id = :cid AND active = 1 ORDER BY id ASC LIMIT 1");
            $firstSp->execute([':cid' => $cid]);
            $spRow = $firstSp->fetch();
            $spCode = $spRow ? $spRow['specialty_code'] : 'MED';
        } catch (\Throwable) {
            $spCode = 'MED';
        }
    }

    // Lookup specialty config for campaign
    $spConfig = null;
    try {
        $spStmt = db()->prepare("SELECT * FROM campaign_specialties WHERE campaign_id = :cid AND specialty_code = :code AND active = 1");
        $spStmt->execute([':cid' => $cid, ':code' => $spCode]);
        $spConfig = $spStmt->fetch();
    } catch (\Throwable) {}

    $spName = $spConfig['specialty_name'] ?? ($b['specialty_name'] ?? ($spCode === 'MED' ? 'Medicina General' : $spCode));
    $medicoId = !empty($b['medico_id']) ? (int)$b['medico_id'] : ($spConfig['medico_id'] ?? null);
    $consultorio = !empty($b['consultorio']) ? trim($b['consultorio']) : ($spConfig['consultorio'] ?? 'Consultorio 01');
    $cupoMax = (int)($spConfig['cupo_maximo'] ?? 30);

    // Validate quota if config exists
    try {
        $countStmt = db()->prepare("SELECT COUNT(*) as cnt FROM atenciones WHERE campaign_id = :cid AND specialty_code = :code");
        $countStmt->execute([':cid' => $cid, ':code' => $spCode]);
        $currentCount = (int)$countStmt->fetch()['cnt'];
    } catch (\Throwable) {
        $currentCount = 0;
    }

    if ($spConfig && $currentCount >= $cupoMax) {
        json_error("No hay cupos disponibles para la especialidad '{$spName}'. Cupo máximo alcanzado ({$cupoMax}/{$cupoMax}).", 422);
    }

    // Next correlative for this specialty in this campaign
    $nextSpecialtyNum = $currentCount + 1;
    $ticketCodigo = sprintf('%s-%04d', $spCode, $nextSpecialtyNum);

    // Overall ticket_number for backwards compatibility
    $stmt = db()->prepare("SELECT COALESCE(MAX(ticket_number), 100) + 1 as next FROM atenciones WHERE campaign_id = :cid");
    $stmt->execute([':cid' => $cid]);
    $ticketNumber = (int)$stmt->fetch()['next'];

    // Mapeo dinámico y seguro de columnas existentes
    $colsStmt = db()->query("SHOW COLUMNS FROM atenciones");
    $existingCols = $colsStmt ? $colsStmt->fetchAll(PDO::FETCH_COLUMN) : [];

    $fields = [
        'beneficiario_id' => $bid,
        'campaign_id'     => $cid,
        'station_id'      => !empty($b['station_id']) ? (int)$b['station_id'] : null,
        'ticket_number'   => $ticketNumber,
        'ticket_codigo'   => $ticketCodigo,
        'specialty_code'  => $spCode,
        'specialty_name'  => $spName,
        'medico_id'       => $medicoId,
        'consultorio'     => $consultorio,
        'arrival_time'    => now_str(),
        'status'          => 'en_espera_triaje',
        'admitted_by'     => $admittedBy,
        'seguro_usado'    => $b['seguro_usado'] ?? null,
        'notes'           => $b['notes'] ?? null,
        'created_at'      => now_str(),
        'updated_at'      => now_str(),
    ];

    if (!empty($existingCols)) {
        $fields = array_intersect_key($fields, array_flip($existingCols));
    }

    $cols = implode(', ', array_keys($fields));
    $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($fields)));
    $params = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));

    $insStmt = db()->prepare("INSERT INTO atenciones ($cols) VALUES ($vals)");
    $insStmt->execute($params);
    $atencionId = (int)db()->lastInsertId();

    $stmt = db()->prepare("
        SELECT a.*,
               b.nombres, b.apellidos, b.dni,
               c.name as campaign_name,
               s.label as station_label,
               CONCAT(um.name, ' ', um.apellidos) as medico_asignado_nombre
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN campaigns c ON c.id = a.campaign_id
        LEFT JOIN stations s ON s.id = a.station_id
        LEFT JOIN users um ON um.id = a.medico_id
        WHERE a.id = :id
    ");
    $stmt->execute([':id' => $atencionId]);
    $row = $stmt->fetch();
    json_ok($row, 201);
}


function atenciones_show(int $id): void {
    $stmt = db()->prepare("
        SELECT a.*,
               b.nombres, b.apellidos, b.dni, b.fecha_nacimiento, b.sexo, b.celular,
               c.name as campaign_name, c.location_name,
               s.label as station_label, s.type as station_type,
               CONCAT(u.name,' ',u.apellidos) as admitted_by_name,
               CONCAT(um.name, ' ', um.apellidos) as medico_asignado_nombre,
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
        LEFT JOIN users um ON um.id = a.medico_id
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
        SELECT a.id, a.ticket_number,
               COALESCE(a.ticket_codigo, CONCAT(COALESCE(a.specialty_code, 'MED'), '-', LPAD(a.ticket_number, 4, '0'))) as ticket_codigo,
               a.specialty_code, a.specialty_name, a.consultorio,
               a.status, a.arrival_time, a.triage_start_at, a.triage_end_at,
               b.nombres, b.apellidos, b.dni, b.sexo, b.fecha_nacimiento,
               t.prioridad, t.prioridad_color, t.prioridad_label,
               s.label as station_label,
               CONCAT(um.name, ' ', um.apellidos) as medico_asignado_nombre
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN stations s ON s.id = a.station_id
        LEFT JOIN users um ON um.id = a.medico_id
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
            SELECT a.id, a.ticket_number,
                   COALESCE(a.ticket_codigo, CONCAT(COALESCE(a.specialty_code, 'MED'), '-', LPAD(a.ticket_number, 4, '0'))) as ticket_codigo,
                   a.specialty_code, a.specialty_name, a.consultorio,
                   a.status, a.arrival_time,
                   b.nombres, b.apellidos, b.dni,
                   t.prioridad, t.prioridad_color,
                   CONCAT(um.name, ' ', um.apellidos) as medico_asignado_nombre
            FROM atenciones a
            LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
            LEFT JOIN triajes t ON t.atencion_id = a.id
            LEFT JOIN users um ON um.id = a.medico_id
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

