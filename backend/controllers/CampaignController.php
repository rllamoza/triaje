<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Campañas
// ============================================================

function campaigns_index(): void {
    $status = get_param('status');

    $where = $status ? "WHERE c.status = :status" : "";
    $params = $status ? [':status' => $status] : [];

    $sql = "
        SELECT
            c.id, c.code, c.name, c.location_name, c.province, c.department,
            c.altitude_masl, c.start_date, c.end_date, c.status,
            c.node_id, c.starlink_active,
            (SELECT COUNT(*) FROM atenciones a WHERE a.campaign_id = c.id AND DATE(a.arrival_time) = CURDATE()) as today_count,
            (SELECT COUNT(*) FROM stations s WHERE s.campaign_id = c.id AND s.active = 1) as stations_count
        FROM campaigns c
        $where
        ORDER BY CASE c.status WHEN 'active' THEN 1 WHEN 'planned' THEN 2 ELSE 3 END
    ";

    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    json_ok($stmt->fetchAll());
}

function campaigns_store(array $user): void {
    $b = body();
    $required = ['code', 'name', 'location_name', 'start_date'];
    foreach ($required as $f) {
        if (empty($b[$f])) json_error("El campo '$f' es obligatorio.", 422);
    }

    // Verificar unicidad de code
    $check = db()->prepare("SELECT id FROM campaigns WHERE code = :code");
    $check->execute([':code' => $b['code']]);
    if ($check->fetch()) json_error("El código de campaña ya existe.", 422);

    db()->prepare("
        INSERT INTO campaigns (code, name, location_name, province, department, altitude_masl,
                               start_date, end_date, status, node_id, starlink_active, created_by, created_at, updated_at)
        VALUES (:code, :name, :loc, :prov, :dept, :alt, :start, :end, :status, :node, :star, :by, NOW(), NOW())
    ")->execute([
        ':code'   => $b['code'],
        ':name'   => $b['name'],
        ':loc'    => $b['location_name'],
        ':prov'   => $b['province'] ?? null,
        ':dept'   => $b['department'] ?? null,
        ':alt'    => isset($b['altitude_masl']) ? (int)$b['altitude_masl'] : null,
        ':start'  => $b['start_date'],
        ':end'    => $b['end_date'] ?? null,
        ':status' => $b['status'] ?? 'planned',
        ':node'   => $b['node_id'] ?? null,
        ':star'   => isset($b['starlink_active']) ? (int)(bool)$b['starlink_active'] : 1,
        ':by'     => $user['id'],
    ]);

    $id = db()->lastInsertId();
    $stmt = db()->prepare("SELECT * FROM campaigns WHERE id = :id");
    $stmt->execute([':id' => $id]);
    json_ok($stmt->fetch(), 201);
}

function campaigns_show(int $id): void {
    $stmt = db()->prepare("SELECT * FROM campaigns WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $c = $stmt->fetch();
    if (!$c) json_error('Campaña no encontrada.', 404);

    $stmtS = db()->prepare("SELECT * FROM stations WHERE campaign_id = :id AND active = 1");
    $stmtS->execute([':id' => $id]);
    $c['stations'] = $stmtS->fetchAll();
    json_ok($c);
}

function campaigns_update(int $id): void {
    $b = body();
    $allowed = ['name','location_name','province','department','altitude_masl',
                'start_date','end_date','status','node_id','starlink_active','notes'];
    $set = [];
    $params = [':id' => $id];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $set[] = "$f = :$f";
            $params[":$f"] = $b[$f];
        }
    }
    if (!$set) json_error('Nada que actualizar.', 422);
    $set[] = "updated_at = NOW()";
    db()->prepare("UPDATE campaigns SET " . implode(', ', $set) . " WHERE id = :id")->execute($params);
    campaigns_show($id);
}

function campaigns_activate(int $id): void {
    db()->exec("UPDATE campaigns SET status = 'planned', updated_at = NOW() WHERE status = 'active'");
    db()->prepare("UPDATE campaigns SET status = 'active', updated_at = NOW() WHERE id = :id")->execute([':id' => $id]);
    $stmt = db()->prepare("SELECT * FROM campaigns WHERE id = :id");
    $stmt->execute([':id' => $id]);
    json_ok(['message' => 'Campaña activada', 'campaign' => $stmt->fetch()]);
}

function campaigns_close(int $id): void {
    db()->prepare("UPDATE campaigns SET status = 'closed', end_date = CURDATE(), updated_at = NOW() WHERE id = :id")
       ->execute([':id' => $id]);
    json_ok(['message' => 'Campaña cerrada']);
}

function campaigns_stats(int $id): void {
    $today = today_str();
    $base = "FROM atenciones WHERE campaign_id = :id AND DATE(arrival_time) = :today";
    $p = [':id' => $id, ':today' => $today];

    $total     = db()->prepare("SELECT COUNT(*) as c $base");               $total->execute($p);
    $fin       = db()->prepare("SELECT COUNT(*) as c $base AND status = 'finalizado'"); $fin->execute($p);
    $esp       = db()->prepare("SELECT COUNT(*) as c $base AND status IN ('admitido','en_espera_triaje','en_espera_medico')"); $esp->execute($p);
    $ref       = db()->prepare("SELECT COUNT(*) as c $base AND status = 'referido'"); $ref->execute($p);
    $rojo      = db()->prepare("SELECT COUNT(*) as c FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.campaign_id = :id AND DATE(a.arrival_time) = :today AND t.prioridad = 'I'"); $rojo->execute($p);
    $amarillo  = db()->prepare("SELECT COUNT(*) as c FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.campaign_id = :id AND DATE(a.arrival_time) = :today AND t.prioridad = 'II'"); $amarillo->execute($p);
    $verde     = db()->prepare("SELECT COUNT(*) as c FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.campaign_id = :id AND DATE(a.arrival_time) = :today AND t.prioridad = 'III'"); $verde->execute($p);

    json_ok([
        'total_hoy'   => (int)$total->fetch()['c'],
        'finalizados' => (int)$fin->fetch()['c'],
        'en_espera'   => (int)$esp->fetch()['c'],
        'referidos'   => (int)$ref->fetch()['c'],
        'rojo'        => (int)$rojo->fetch()['c'],
        'amarillo'    => (int)$amarillo->fetch()['c'],
        'verde'       => (int)$verde->fetch()['c'],
    ]);
}

function campaigns_stations(int $id): void {
    $stmt = db()->prepare("SELECT * FROM stations WHERE campaign_id = :id AND active = 1");
    $stmt->execute([':id' => $id]);
    json_ok($stmt->fetchAll());
}

function campaigns_store_station(int $id): void {
    $b = body();
    $required = ['code', 'type', 'label'];
    foreach ($required as $f) {
        if (empty($b[$f])) json_error("El campo '$f' es obligatorio.", 422);
    }
    $validTypes = ['admision','triaje','medico','farmacia','pediatria','otro'];
    if (!in_array($b['type'], $validTypes)) json_error("Tipo de estación inválido.", 422);

    db()->prepare("
        INSERT INTO stations (campaign_id, code, type, label, printer_id, active, created_at, updated_at)
        VALUES (:cid, :code, :type, :label, :pid, 1, NOW(), NOW())
    ")->execute([
        ':cid'  => $id,
        ':code' => $b['code'],
        ':type' => $b['type'],
        ':label'=> $b['label'],
        ':pid'  => $b['printer_id'] ?? null,
    ]);

    $sid = db()->lastInsertId();
    $stmt = db()->prepare("SELECT * FROM stations WHERE id = :id");
    $stmt->execute([':id' => $sid]);
    json_ok($stmt->fetch(), 201);
}
