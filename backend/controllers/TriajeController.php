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
    if (empty($b['atencion_id'])) json_error("El campo 'atencion_id' es obligatorio.", 422);
    if (empty($b['prioridad']) || !in_array($b['prioridad'], ['I','II','III'])) {
        json_error("Prioridad inválida. Use I, II o III.", 422);
    }

    // Calcular IMC
    if (!empty($b['peso_kg']) && !empty($b['talla_cm']) && $b['talla_cm'] > 0) {
        $t        = $b['talla_cm'] / 100;
        $b['imc'] = round($b['peso_kg'] / ($t * $t), 1);
    }

    $altitud = (int)($b['altitud_atencion_masl'] ?? 0);

    // Buscar si ya existe
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
        'prioridad_color'         => $b['prioridad_color'] ?? null,
        'sintoma_principal'       => $b['sintoma_principal'] ?? null,
        'alergias_activas'        => $alergias,
        'motivo_consulta'         => $b['motivo_consulta'] ?? null,
        'observaciones_triaje'    => $b['observaciones_triaje'] ?? null,
        'enfermera_id'            => $b['enfermera_id'] ?? $user['id'],
        'updated_at'              => now_str(),
    ];

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
