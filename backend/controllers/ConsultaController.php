<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Consultas Médicas
// ============================================================

function consultas_store(array $user): void {
    $b = body();
    if (empty($b['atencion_id'])) json_error("El campo 'atencion_id' es obligatorio.", 422);
    if (empty($b['medico_id']))   json_error("El campo 'medico_id' es obligatorio.", 422);

    $check = db()->prepare("SELECT id FROM consultas WHERE atencion_id = :aid");
    $check->execute([':aid' => $b['atencion_id']]);
    $existing = $check->fetch();

    $fields = [
        'atencion_id'             => (int)$b['atencion_id'],
        'medico_id'               => (int)$b['medico_id'],
        'motivo_consulta'         => $b['motivo_consulta'] ?? null,
        'enfermedad_actual'       => $b['enfermedad_actual'] ?? null,
        'antecedentes_personales' => $b['antecedentes_personales'] ?? null,
        'antecedentes_familiares' => $b['antecedentes_familiares'] ?? null,
        'examen_fisico'           => isset($b['examen_fisico']) ? json_encode($b['examen_fisico']) : null,
        'diagnosticos'            => isset($b['diagnosticos']) ? json_encode($b['diagnosticos']) : null,
        'plan_tratamiento'        => $b['plan_tratamiento'] ?? null,
        'indicaciones'            => $b['indicaciones'] ?? null,
        'receta'                  => isset($b['receta']) ? json_encode($b['receta']) : null,
        'examenes_solicitados'    => isset($b['examenes_solicitados']) ? json_encode($b['examenes_solicitados']) : null,
        'requiere_referencia'     => isset($b['requiere_referencia']) ? (int)(bool)$b['requiere_referencia'] : 0,
        'referencia_destino'      => $b['referencia_destino'] ?? null,
        'referencia_urgencia'     => $b['referencia_urgencia'] ?? null,
        'updated_at'              => now_str(),
    ];

    if ($existing) {
        $set = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($fields)));
        $p   = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));
        $p[':id'] = $existing['id'];
        db()->prepare("UPDATE consultas SET $set WHERE id = :id")->execute($p);
        $consultaId = $existing['id'];
    } else {
        $fields['created_at'] = now_str();
        $cols = implode(', ', array_keys($fields));
        $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($fields)));
        $p    = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));
        db()->prepare("INSERT INTO consultas ($cols) VALUES ($vals)")->execute($p);
        $consultaId = db()->lastInsertId();
    }

    db()->prepare("UPDATE atenciones SET status = 'en_consulta', medico_start_at = NOW(), updated_at = NOW() WHERE id = :id")
       ->execute([':id' => $b['atencion_id']]);

    $stmt = db()->prepare("SELECT co.*, CONCAT(u.name,' ',u.apellidos) as medico_nombre FROM consultas co LEFT JOIN users u ON u.id = co.medico_id WHERE co.id = :id");
    $stmt->execute([':id' => $consultaId]);
    $row = $stmt->fetch();
    foreach (['examen_fisico','diagnosticos','receta','examenes_solicitados'] as $jsonField) {
        if (!empty($row[$jsonField])) $row[$jsonField] = json_decode($row[$jsonField], true);
    }
    json_ok($row, 201);
}

function consultas_show_by_atencion(int $atencionId): void {
    $stmt = db()->prepare("
        SELECT co.*, CONCAT(u.name,' ',u.apellidos) as medico_nombre,
               b.nombres, b.apellidos, b.dni,
               t.prioridad, t.prioridad_color
        FROM consultas co
        LEFT JOIN users u ON u.id = co.medico_id
        LEFT JOIN atenciones a ON a.id = co.atencion_id
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN triajes t ON t.atencion_id = co.atencion_id
        WHERE co.atencion_id = :id
    ");
    $stmt->execute([':id' => $atencionId]);
    $row = $stmt->fetch();
    if (!$row) json_error('Consulta no encontrada para esta atención.', 404);
    foreach (['examen_fisico','diagnosticos','receta','examenes_solicitados'] as $jf) {
        if (!empty($row[$jf])) $row[$jf] = json_decode($row[$jf], true);
    }
    json_ok($row);
}

function consultas_update(int $id): void {
    $stmt = db()->prepare("SELECT * FROM consultas WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $consulta = $stmt->fetch();
    if (!$consulta) json_error('Consulta no encontrada.', 404);
    if ($consulta['signed_at']) json_error('Consulta ya firmada, no puede modificarse.', 403);

    $b = body();
    $allowed = ['motivo_consulta','enfermedad_actual','antecedentes_personales','antecedentes_familiares',
                'examen_fisico','diagnosticos','plan_tratamiento','indicaciones','receta',
                'examenes_solicitados','requiere_referencia','referencia_destino','referencia_urgencia'];
    $set = []; $params = [':id' => $id];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $set[] = "$f = :$f";
            $params[":$f"] = is_array($b[$f]) ? json_encode($b[$f]) : $b[$f];
        }
    }
    if (!$set) json_error('Nada que actualizar.', 422);
    $set[] = "updated_at = NOW()";
    db()->prepare("UPDATE consultas SET " . implode(', ', $set) . " WHERE id = :id")->execute($params);

    $stmt2 = db()->prepare("SELECT * FROM consultas WHERE id = :id");
    $stmt2->execute([':id' => $id]);
    $row = $stmt2->fetch();
    foreach (['examen_fisico','diagnosticos','receta','examenes_solicitados'] as $jf) {
        if (!empty($row[$jf])) $row[$jf] = json_decode($row[$jf], true);
    }
    json_ok($row);
}

function consultas_firmar(int $id, array $user): void {
    $stmt = db()->prepare("SELECT * FROM consultas WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $consulta = $stmt->fetch();
    if (!$consulta) json_error('Consulta no encontrada.', 404);
    if ($consulta['signed_at']) json_error('Ya fue firmada.', 409);

    $payload   = $id . '|' . $user['id'] . '|' . date('c');
    $signature = hmac_sign($payload);
    $signedAt  = now_str();

    db()->prepare("UPDATE consultas SET signature_hash = :sig, signed_at = :sat, updated_at = NOW() WHERE id = :id")
       ->execute([':sig' => $signature, ':sat' => $signedAt, ':id' => $id]);

    $newStatus = $consulta['requiere_referencia'] ? 'referido' : 'finalizado';
    db()->prepare("UPDATE atenciones SET status = :status, medico_end_at = NOW(), referred_to = :ref, updated_at = NOW() WHERE id = :id")
       ->execute([':status' => $newStatus, ':ref' => $consulta['referencia_destino'], ':id' => $consulta['atencion_id']]);

    json_ok([
        'message'        => 'Consulta firmada y cerrada',
        'signature_hash' => $signature,
        'signed_at'      => $signedAt,
    ]);
}

function consultas_medicamentos(): void {
    $q = get_param('q');
    $sql = "SELECT id, nombre_generico, nombre_comercial, concentracion, forma_farmaceutica, via_administracion
            FROM medicamentos WHERE activo = 1";
    if ($q) {
        $sql .= " AND (nombre_generico LIKE :q1 OR nombre_comercial LIKE :q2)";
        $stmt = db()->prepare($sql . " LIMIT 20");
        $like = "%$q%";
        $stmt->execute([':q1' => $like, ':q2' => $like]);
    } else {
        $stmt = db()->prepare($sql . " LIMIT 20");
        $stmt->execute();
    }
    json_ok($stmt->fetchAll());
}
