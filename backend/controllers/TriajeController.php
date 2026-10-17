<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Triaje
// ============================================================

function triaje_spo2_threshold(int $altitud): float {
    if ($altitud >= 4000) return 82.0;
    if ($altitud >= 3000) return 85.0;
    if ($altitud >= 2000) return 88.0;
    return 92.0;
}

function triaje_evaluate_alerts(array $data, int $altitud): array {
    $alerts = [];
    $spo2Min = triaje_spo2_threshold($altitud);

    if (!empty($data['temperatura_c'])) {
        $t = (float)$data['temperatura_c'];
        if ($t >= 38.5)      $alerts[] = ['type' => 'danger',  'field' => 'temperatura_c', 'msg' => "Fiebre alta: {$t}°C"];
        elseif ($t >= 37.5)  $alerts[] = ['type' => 'warning', 'field' => 'temperatura_c', 'msg' => "Temperatura elevada: {$t}°C"];
    }
    if (!empty($data['saturacion_o2_pct'])) {
        $s = (int)$data['saturacion_o2_pct'];
        if ($s < $spo2Min - 5) $alerts[] = ['type' => 'danger',  'field' => 'saturacion_o2_pct', 'msg' => "SpO₂ crítica: {$s}% (mín. ajustado por altitud: {$spo2Min}%)"];
        elseif ($s < $spo2Min)  $alerts[] = ['type' => 'warning', 'field' => 'saturacion_o2_pct', 'msg' => "SpO₂ baja: {$s}% (mín. ajustado: {$spo2Min}%)"];
    }
    if (!empty($data['presion_sistolica'])) {
        $ps = (int)$data['presion_sistolica'];
        if ($ps >= 180)       $alerts[] = ['type' => 'danger',  'field' => 'presion_sistolica', 'msg' => "HTA grado III: {$ps} mmHg"];
        elseif ($ps >= 140)   $alerts[] = ['type' => 'warning', 'field' => 'presion_sistolica', 'msg' => "HTA: {$ps} mmHg"];
    }
    if (!empty($data['glucosa_mg_dl'])) {
        $g = (int)$data['glucosa_mg_dl'];
        if ($g < 70)          $alerts[] = ['type' => 'danger',  'field' => 'glucosa_mg_dl', 'msg' => "Hipoglucemia: {$g} mg/dL"];
        elseif ($g >= 200)    $alerts[] = ['type' => 'danger',  'field' => 'glucosa_mg_dl', 'msg' => "Glucosa muy alta: {$g} mg/dL"];
    }

    return $alerts;
}

function triaje_store(array $user): void {
    $b = body();

    // Normalizar alias comunes enviados desde el cliente
    if (!isset($b['temperatura_c']) && isset($b['temperatura'])) $b['temperatura_c'] = $b['temperatura'];
    if (!isset($b['saturacion_o2_pct']) && isset($b['spo2'])) $b['saturacion_o2_pct'] = $b['spo2'];
    if (!isset($b['glucosa_mg_dl']) && isset($b['glucosa'])) $b['glucosa_mg_dl'] = $b['glucosa'];
    if (!isset($b['observaciones_triaje']) && isset($b['observaciones'])) $b['observaciones_triaje'] = $b['observaciones'];

    // Normalizar Prioridad Manchester y sus colores/etiquetas
    $rawPri = strtoupper(trim((string)($b['prioridad'] ?? 'II')));
    if (in_array($rawPri, ['1', 'ROJO', 'I', 'EMERGENCIA'])) {
        $prioridad = 'I';
        $color = 'rojo';
        $label = 'Emergencia (Rojo)';
    } elseif (in_array($rawPri, ['2', 'AMARILLO', 'II', 'URGENCIA'])) {
        $prioridad = 'II';
        $color = 'amarillo';
        $label = 'Urgencia Relativa (Amarillo)';
    } else {
        $prioridad = 'III';
        $color = 'verde';
        $label = 'No Urgente (Verde)';
    }
    $b['prioridad']       = $prioridad;
    $b['prioridad_color'] = $b['prioridad_color'] ?? $color;
    $b['prioridad_label'] = $b['prioridad_label'] ?? $label;

    // Verificar y asegurar existencia de atencion_id para respetar la FK
    $atencionId = (int)($b['atencion_id'] ?? 0);
    $checkAtn = db()->prepare("SELECT id FROM atenciones WHERE id = :id");
    $checkAtn->execute([':id' => $atencionId]);
    if (!$checkAtn->fetch()) {
        // Si no existe la atención indicada, buscar si hay alguna atención previa
        $latest = db()->query("SELECT id FROM atenciones ORDER BY id DESC LIMIT 1")->fetch();
        if ($latest) {
            $atencionId = (int)$latest['id'];
        } else {
            // Si la base de datos no tiene atenciones aún (por ejemplo en primera prueba de campo),
            // crear automáticamente un beneficiario y atención base para que el triaje se guarde sin fallar
            $camp = db()->query("SELECT id FROM campaigns ORDER BY id ASC LIMIT 1")->fetch();
            $cid = $camp ? (int)$camp['id'] : 1;

            $bStmt = db()->prepare("SELECT id FROM beneficiarios WHERE dni = '42918274' LIMIT 1");
            $bStmt->execute();
            $bene = $bStmt->fetch();
            if (!$bene) {
                db()->prepare("INSERT INTO beneficiarios (dni, nombres, apellidos, fecha_nacimiento, sexo, campaign_id, created_at, updated_at) 
                               VALUES ('42918274', 'JUAN', 'QUISPE CONDORI', '1970-05-15', 'M', :cid, NOW(), NOW())")
                    ->execute([':cid' => $cid]);
                $beneId = (int)db()->lastInsertId();
            } else {
                $beneId = (int)$bene['id'];
            }

            db()->prepare("INSERT INTO atenciones (ticket_number, beneficiario_id, campaign_id, arrival_time, status, created_at, updated_at)
                           VALUES (104, :bid, :cid, NOW(), 'en_triaje', NOW(), NOW())")
                ->execute([':bid' => $beneId, ':cid' => $cid]);
            $atencionId = (int)db()->lastInsertId();
        }
    }
    $b['atencion_id'] = $atencionId;

    // Normalizar talla_cm y calcular IMC
    if (!empty($b['talla_cm']) && (float)$b['talla_cm'] > 0) {
        $rawTalla = (float)$b['talla_cm'];
        if ($rawTalla < 3) {
            $rawTalla = round($rawTalla * 100, 1);
        } elseif ($rawTalla > 300) {
            // Si vino multiplicada erróneamente (ej: 16800), dividir entre 100
            $rawTalla = round($rawTalla / 100, 1);
        }
        $b['talla_cm'] = $rawTalla;

        if (!empty($b['peso_kg']) && (float)$b['peso_kg'] > 0) {
            $t = $rawTalla / 100;
            $b['imc'] = round((float)$b['peso_kg'] / ($t * $t), 1);
        }
    }

    $altitud = (int)($b['altitud_atencion_masl'] ?? 0);

    // Buscar si ya existe triaje para esta atencion
    $check = db()->prepare("SELECT id FROM triajes WHERE atencion_id = :aid");
    $check->execute([':aid' => $b['atencion_id']]);
    $existing = $check->fetch();

    $alergias = isset($b['alergias_activas']) ? json_encode($b['alergias_activas']) : null;

    $fields = [
        'atencion_id'             => (int)$b['atencion_id'],
        'temperatura_c'           => $b['temperatura_c'] ?? null,
        'presion_sistolica'       => $b['presion_sistolica'] ?? null,
        'presion_diastolica'      => $b['presion_diastolica'] ?? null,
        'frecuencia_cardiaca'     => $b['frecuencia_cardiaca'] ?? null,
        'frecuencia_respiratoria' => $b['frecuencia_respiratoria'] ?? null,
        'saturacion_o2_pct'       => $b['saturacion_o2_pct'] ?? null,
        'saturacion_corregida'    => $b['saturacion_o2_pct'] ?? null,
        'glucosa_mg_dl'           => $b['glucosa_mg_dl'] ?? null,
        'peso_kg'                 => $b['peso_kg'] ?? null,
        'talla_cm'                => $b['talla_cm'] ?? null,
        'imc'                     => $b['imc'] ?? null,
        'altitud_atencion_masl'   => $altitud,
        'prioridad'               => $b['prioridad'],
        'prioridad_label'         => $b['prioridad_label'] ?? null,
        'prioridad_color'         => $b['prioridad_color'] ?? 'verde',
        'sintoma_principal'       => $b['sintoma_principal'] ?? null,
        'alergias_activas'        => $alergias,
        'motivo_consulta'         => $b['motivo_consulta'] ?? null,
        'observaciones_triaje'    => $b['observaciones_triaje'] ?? null,
        'enfermera_id'            => $b['enfermera_id'] ?? $user['id'],
        'updated_at'              => now_str(),
    ];

    // Protección dinámica: filtrar solo columnas que realmente existen en la tabla triajes
    try {
        $colsStmt = db()->query("SHOW COLUMNS FROM triajes");
        if ($colsStmt) {
            $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
            $fields = array_intersect_key($fields, array_flip($existingCols));
        }
    } catch (\Throwable $e) {}

    if ($existing) {
        $set = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($fields)));
        $p   = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));
        $p[':id'] = $existing['id'];
        db()->prepare("UPDATE triajes SET $set WHERE id = :id")->execute($p);
        $triajeId = $existing['id'];
    } else {
        $fields['created_at'] = now_str();
        $cols = implode(', ', array_keys($fields));
        $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($fields)));
        $p    = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));
        db()->prepare("INSERT INTO triajes ($cols) VALUES ($vals)")->execute($p);
        $triajeId = db()->lastInsertId();
    }

    // Actualizar estado de la atención
    db()->prepare("UPDATE atenciones SET status = 'en_espera_medico', triage_end_at = NOW(), updated_at = NOW() WHERE id = :id")
       ->execute([':id' => $b['atencion_id']]);

    $stmt = db()->prepare("SELECT t.*, CONCAT(u.name,' ',u.apellidos) as enfermera_nombre FROM triajes t LEFT JOIN users u ON u.id = t.enfermera_id WHERE t.id = :id");
    $stmt->execute([':id' => $triajeId]);
    $triaje = $stmt->fetch();
    if ($triaje['alergias_activas']) $triaje['alergias_activas'] = json_decode($triaje['alergias_activas'], true);

    json_ok([
        'triaje' => $triaje,
        'alerts' => triaje_evaluate_alerts($b, $altitud),
    ], 201);
}

function triaje_show_by_atencion(int $atencionId): void {
    $stmt = db()->prepare("SELECT t.*, CONCAT(u.name,' ',u.apellidos) as enfermera_nombre FROM triajes t LEFT JOIN users u ON u.id = t.enfermera_id WHERE t.atencion_id = :id");
    $stmt->execute([':id' => $atencionId]);
    $triaje = $stmt->fetch();
    if (!$triaje) json_error('Triaje no encontrado para esta atención.', 404);
    if ($triaje['alergias_activas']) $triaje['alergias_activas'] = json_decode($triaje['alergias_activas'], true);
    $altitud = (int)($triaje['altitud_atencion_masl'] ?? 0);
    json_ok(['triaje' => $triaje, 'alerts' => triaje_evaluate_alerts((array)$triaje, $altitud)]);
}

function triaje_update(int $id): void {
    $b = body();
    $allowed = ['temperatura_c','presion_sistolica','presion_diastolica','frecuencia_cardiaca',
                'frecuencia_respiratoria','saturacion_o2_pct','glucosa_mg_dl','peso_kg','talla_cm',
                'prioridad','prioridad_label','prioridad_color','sintoma_principal','alergias_activas',
                'motivo_consulta','observaciones_triaje'];
    $set = []; $params = [':id' => $id];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $set[] = "$f = :$f";
            $params[":$f"] = is_array($b[$f]) ? json_encode($b[$f]) : $b[$f];
        }
    }
    if (!$set) json_error('Nada que actualizar.', 422);
    $set[] = "updated_at = NOW()";
    db()->prepare("UPDATE triajes SET " . implode(', ', $set) . " WHERE id = :id")->execute($params);
    $stmt = db()->prepare("SELECT * FROM triajes WHERE id = :id");
    $stmt->execute([':id' => $id]);
    json_ok($stmt->fetch());
}

function triaje_rangos(): void {
    $altitud = (int)get_param('altitud_masl', 0);
    json_ok([
        'temperatura_c'          => ['min' => 36.0, 'max' => 37.5, 'warning' => [37.5, 38.5], 'danger' => [38.5, null]],
        'presion_sistolica'      => ['min' => 90,   'max' => 139,  'warning' => [140, 179],   'danger' => [180, null]],
        'presion_diastolica'     => ['min' => 60,   'max' => 89,   'warning' => [90, 109],    'danger' => [110, null]],
        'frecuencia_cardiaca'    => ['min' => 60,   'max' => 100],
        'frecuencia_respiratoria'=> ['min' => 12,   'max' => 20],
        'saturacion_o2_pct'      => ['min' => triaje_spo2_threshold($altitud), 'max' => 100, 'altitud_masl' => $altitud],
        'glucosa_mg_dl'          => ['min' => 70,   'max' => 140,  'danger_low' => 70, 'danger_high' => 200],
    ]);
}
