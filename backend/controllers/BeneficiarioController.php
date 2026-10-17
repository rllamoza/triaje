<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Beneficiarios
// ============================================================

function beneficiarios_reniec(string $dni): void {
    if (!preg_match('/^\d{8}$/', $dni)) {
        json_error('DNI debe tener 8 dígitos numéricos', 422);
    }

    // 1. Buscar en la base de datos local primero
    $stmt = db()->prepare("SELECT * FROM beneficiarios WHERE dni = :dni LIMIT 1");
    $stmt->execute([':dni' => $dni]);
    $local = $stmt->fetch();

    if ($local) {
        json_ok([
            'found'            => true,
            'from_cache'       => true,
            'source'           => 'Padrón Comunitario',
            'data'             => $local,
            'dni'              => $local['dni'],
            'nombres'          => $local['nombres'],
            'apellido_paterno' => explode(' ', $local['apellidos'])[0] ?? '',
            'apellido_materno' => explode(' ', $local['apellidos'])[1] ?? '',
            'apellidos'        => $local['apellidos'],
            'fecha_nacimiento' => $local['fecha_nacimiento'],
            'sexo'             => $local['sexo'],
            'comunidad'        => $local['comunidad'],
            'telefono'         => $local['celular'],
            'direccion'        => null,
        ]);
    }

    // 2. Intentar API RENIEC
    if (RENIEC_TOKEN && RENIEC_URL) {
        $ctx = stream_context_create(['http' => [
            'header' => "Authorization: Bearer " . RENIEC_TOKEN . "\r\nAccept: application/json\r\n",
            'timeout' => 8,
        ]]);
        $raw = @file_get_contents(RENIEC_URL . $dni, false, $ctx);
        if ($raw) {
            $data = json_decode($raw, true);
            if ($data && !empty($data['nombres'])) {
                $apellidos = trim(($data['apellidoPaterno'] ?? '') . ' ' . ($data['apellidoMaterno'] ?? ''));
                json_ok([
                    'found'            => true,
                    'from_cache'       => false,
                    'source'           => 'RENIEC Cloud Oficial',
                    'dni'              => $dni,
                    'nombres'          => $data['nombres'],
                    'apellido_paterno' => $data['apellidoPaterno'] ?? '',
                    'apellido_materno' => $data['apellidoMaterno'] ?? '',
                    'apellidos'        => $apellidos,
                    'fecha_nacimiento' => $data['fechaNacimiento'] ?? null,
                    'sexo'             => $data['sexo'] ?? 'O',
                    'comunidad'        => null,
                    'telefono'         => null,
                    'direccion'        => $data['direccion'] ?? null,
                    'data'             => $data,
                ]);
            }
        }
    }

    json_error('DNI no encontrado en RENIEC ni en Padrón Local', 404, ['from_cache' => false]);
}

function beneficiarios_check_duplicate(string $dni): void {
    $campaignId = get_param('campaign_id');
    $sql = "SELECT b.id, b.dni, b.nombres, b.apellidos FROM beneficiarios b WHERE b.dni = :dni";
    if ($campaignId) {
        $sql .= " AND EXISTS (SELECT 1 FROM atenciones a WHERE a.beneficiario_id = b.id AND a.campaign_id = :cid)";
        $stmt = db()->prepare($sql . " LIMIT 1");
        $stmt->execute([':dni' => $dni, ':cid' => $campaignId]);
    } else {
        $stmt = db()->prepare($sql . " LIMIT 1");
        $stmt->execute([':dni' => $dni]);
    }
    $existing = $stmt->fetch();
    json_ok([
        'duplicate'    => (bool)$existing,
        'beneficiario' => $existing ?: null,
    ]);
}

function beneficiarios_index(): void {
    $search     = get_param('search');
    $campaignId = get_param('campaign_id');
    $page       = max(1, (int)get_param('page', 1));
    $perPage    = 20;

    $where  = [];
    $params = [];

    if ($search) {
        $where[]        = "(b.dni LIKE :s1 OR b.nombres LIKE :s2 OR b.apellidos LIKE :s3)";
        $like           = "%$search%";
        $params[':s1']  = $like;
        $params[':s2']  = $like;
        $params[':s3']  = $like;
    }
    if ($campaignId) {
        $where[]           = "b.campaign_id = :cid";
        $params[':cid']    = $campaignId;
    }

    $whereClause = $where ? "WHERE " . implode(' AND ', $where) : '';
    $sql = "
        SELECT b.*,
               (SELECT a.ticket_number FROM atenciones a WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as latest_ticket,
               (SELECT a.id FROM atenciones a WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as latest_atencion_id,
               (SELECT t.prioridad FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_prioridad,
               (SELECT t.prioridad_color FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_prioridad_color,
               (SELECT t.temperatura_c FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_temperatura,
               (SELECT t.presion_sistolica FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_pa_sistolica,
               (SELECT t.presion_diastolica FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_pa_diastolica,
               (SELECT t.frecuencia_cardiaca FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_fc,
               (SELECT t.frecuencia_respiratoria FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_fr,
               (SELECT t.saturacion_o2_pct FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_spo2,
               (SELECT t.glucosa_mg_dl FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_glucosa,
               (SELECT t.peso_kg FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_peso,
               (SELECT t.talla_cm FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_talla,
               (SELECT t.imc FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_imc,
               (SELECT t.observaciones_triaje FROM atenciones a JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = b.id ORDER BY a.id DESC LIMIT 1) as triaje_observaciones
        FROM beneficiarios b 
        $whereClause 
        ORDER BY b.apellidos
    ";
    json_ok(paginate($sql, $params, $perPage, $page));
}

function beneficiarios_store(array $user): void {
    $b = body();
    if (empty($b['campaign_id'])) $b['campaign_id'] = 1;
    if (empty($b['celular']) && !empty($b['telefono'])) $b['celular'] = $b['telefono'];

    $required = ['dni','nombres','apellidos','fecha_nacimiento','sexo'];
    foreach ($required as $f) {
        if (empty($b[$f])) json_error("El campo '$f' es obligatorio.", 422);
    }
    if (!in_array($b['sexo'], ['M','F','O'])) json_error("Sexo inválido. Use M, F u O.", 422);

    // Calcular edad e IMC
    $edad = (int)date_diff(date_create($b['fecha_nacimiento']), date_create('today'))->y;
    $imc  = null;
    if (!empty($b['peso_kg']) && !empty($b['talla_cm']) && $b['talla_cm'] > 0) {
        $t   = $b['talla_cm'] / 100;
        $imc = round($b['peso_kg'] / ($t * $t), 1);
    }

    // updateOrCreate por dni
    $check = db()->prepare("SELECT id FROM beneficiarios WHERE dni = :dni");
    $check->execute([':dni' => $b['dni']]);
    $existing = $check->fetch();

    // Normalizar idioma_principal según enum('espanol','quechua','aymara','otro')
    $rawIdioma = strtolower(trim((string)($b['idioma_principal'] ?? '')));
    if (str_contains($rawIdioma, 'quechua')) {
        $idioma = 'quechua';
    } elseif (str_contains($rawIdioma, 'aymara') || str_contains($rawIdioma, 'aimara')) {
        $idioma = 'aymara';
    } elseif (str_contains($rawIdioma, 'espanol') || str_contains($rawIdioma, 'español') || str_contains($rawIdioma, 'castellano')) {
        $idioma = 'espanol';
    } elseif (!empty($rawIdioma)) {
        $idioma = 'otro';
    } else {
        $idioma = 'espanol';
    }

    // Normalizar tipo_seguro según enum('SIS','ESSALUD','privado','ninguno','otro')
    $rawSeguro = strtoupper(trim((string)($b['tipo_seguro'] ?? '')));
    if (str_contains($rawSeguro, 'SIS')) {
        $seguro = 'SIS';
    } elseif (str_contains($rawSeguro, 'ESSALUD') || str_contains($rawSeguro, 'SEGURO SOCIAL')) {
        $seguro = 'ESSALUD';
    } elseif (str_contains($rawSeguro, 'PRIVADO') || str_contains($rawSeguro, 'FFAA')) {
        $seguro = 'privado';
    } elseif (str_contains($rawSeguro, 'NINGUNO') || str_contains($rawSeguro, 'SIN SEGURO')) {
        $seguro = 'ninguno';
    } elseif (!empty($rawSeguro)) {
        $seguro = 'otro';
    } else {
        $seguro = 'ninguno';
    }

    // Normalizar estado_civil según enum('soltero','casado','conviviente','viudo','divorciado')
    $rawEc = strtolower(trim((string)($b['estado_civil'] ?? '')));
    $ec = in_array($rawEc, ['soltero', 'casado', 'conviviente', 'viudo', 'divorciado']) ? $rawEc : null;

    $fields = [
        'nombres'           => $b['nombres'],
        'apellidos'         => $b['apellidos'],
        'fecha_nacimiento'  => $b['fecha_nacimiento'],
        'sexo'              => $b['sexo'],
        'estado_civil'      => $ec,
        'idioma_principal'  => $idioma,
        'region'            => $b['region'] ?? null,
        'provincia'         => $b['provincia'] ?? null,
        'distrito'          => $b['distrito'] ?? null,
        'comunidad'         => $b['comunidad'] ?? null,
        'altitud_residencia'=> isset($b['altitud_residencia']) ? (int)$b['altitud_residencia'] : null,
        'tipo_seguro'       => $seguro,
        'numero_afiliacion' => $b['numero_afiliacion'] ?? null,
        'celular'           => $b['celular'] ?? null,
        'grupo_sanguineo'   => $b['grupo_sanguineo'] ?? null,
        'rh_factor'         => $b['rh_factor'] ?? null,
        'peso_kg'           => $b['peso_kg'] ?? null,
        'talla_cm'          => $b['talla_cm'] ?? null,
        'edad_calculada'    => $edad,
        'reniec_verified'   => isset($b['reniec_verified']) ? (int)(bool)$b['reniec_verified'] : 0,
        'campaign_id'       => (int)($b['campaign_id'] ?? 1),
        'registered_by'     => $user['id'],
        'updated_at'        => now_str(),
    ];

    // Protección dinámica: filtrar solo columnas que realmente existen en la tabla
    try {
        $colsStmt = db()->query("SHOW COLUMNS FROM beneficiarios");
        if ($colsStmt) {
            $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
            $fields = array_intersect_key($fields, array_flip($existingCols));
        }
    } catch (\Throwable $e) {
        // En caso de restricción en SHOW COLUMNS, continuar con las columnas estándar
    }

    if ($existing) {
        $set = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($fields)));
        $params = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));
        $params[':id'] = $existing['id'];
        db()->prepare("UPDATE beneficiarios SET $set WHERE id = :id")->execute($params);
        $benefId = $existing['id'];
    } else {
        $fields['dni']        = $b['dni'];
        $fields['created_at'] = now_str();
        $cols   = implode(', ', array_keys($fields));
        $vals   = implode(', ', array_map(fn($k) => ":$k", array_keys($fields)));
        $params = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));
        db()->prepare("INSERT INTO beneficiarios ($cols) VALUES ($vals)")->execute($params);
        $benefId = db()->lastInsertId();
    }

    $stmt = db()->prepare("SELECT * FROM beneficiarios WHERE id = :id");
    $stmt->execute([':id' => $benefId]);
    json_ok($stmt->fetch(), 201);
}

function beneficiarios_show(int $id): void {
    $stmt = db()->prepare("SELECT * FROM beneficiarios WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $b = $stmt->fetch();
    if (!$b) json_error('Beneficiario no encontrado.', 404);

    // Cargar atenciones con todos los datos completos de triaje
    $stmt2 = db()->prepare("
        SELECT a.*, 
               t.id as triaje_id, t.temperatura_c, t.presion_sistolica, t.presion_diastolica,
               t.frecuencia_cardiaca, t.frecuencia_respiratoria, t.saturacion_o2_pct,
               t.glucosa_mg_dl, t.peso_kg as triaje_peso_kg, t.talla_cm as triaje_talla_cm,
               t.imc as triaje_imc, t.prioridad, t.prioridad_label, t.prioridad_color,
               t.sintoma_principal, t.observaciones_triaje, t.alergias_activas
        FROM atenciones a 
        LEFT JOIN triajes t ON t.atencion_id = a.id 
        WHERE a.beneficiario_id = :id 
        ORDER BY a.arrival_time DESC
    ");
    $stmt2->execute([':id' => $id]);
    $atenciones = $stmt2->fetchAll();
    $b['atenciones'] = $atenciones;

    // Asignar el triaje más reciente directamente si existe
    $b['triaje'] = null;
    $b['latest_atencion'] = $atenciones[0] ?? null;
    foreach ($atenciones as $atn) {
        if (!empty($atn['triaje_id'])) {
            $b['triaje'] = [
                'id' => (int)$atn['triaje_id'],
                'atencion_id' => (int)$atn['id'],
                'ticket_number' => $atn['ticket_number'],
                'temperatura_c' => $atn['temperatura_c'],
                'presion_sistolica' => $atn['presion_sistolica'],
                'presion_diastolica' => $atn['presion_diastolica'],
                'frecuencia_cardiaca' => $atn['frecuencia_cardiaca'],
                'frecuencia_respiratoria' => $atn['frecuencia_respiratoria'],
                'saturacion_o2_pct' => $atn['saturacion_o2_pct'],
                'glucosa_mg_dl' => $atn['glucosa_mg_dl'],
                'peso_kg' => $atn['triaje_peso_kg'],
                'talla_cm' => $atn['triaje_talla_cm'],
                'imc' => $atn['triaje_imc'],
                'prioridad' => $atn['prioridad'],
                'prioridad_label' => $atn['prioridad_label'],
                'prioridad_color' => $atn['prioridad_color'],
                'sintoma_principal' => $atn['sintoma_principal'],
                'observaciones_triaje' => $atn['observaciones_triaje'],
                'alergias_activas' => $atn['alergias_activas'],
            ];
            break;
        }
    }

    json_ok($b);
}

function beneficiarios_historial(int $id): void {
    $stmt = db()->prepare("
        SELECT a.*, c.name as campaign_name,
               t.prioridad, t.prioridad_color, t.temperatura_c, t.presion_sistolica, t.presion_diastolica, t.saturacion_o2_pct,
               CONCAT(u.name, ' ', u.apellidos) as medico_nombre,
               s.label as station_label
        FROM atenciones a
        LEFT JOIN campaigns c ON c.id = a.campaign_id
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN consultas co ON co.atencion_id = a.id
        LEFT JOIN users u ON u.id = co.medico_id
        LEFT JOIN stations s ON s.id = a.station_id
        WHERE a.beneficiario_id = :id
        ORDER BY a.arrival_time DESC
    ");
    $stmt->execute([':id' => $id]);
    json_ok($stmt->fetchAll());
}

function beneficiarios_update(int $id): void {
    $stmt = db()->prepare("SELECT * FROM beneficiarios WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();
    if (!$existing) json_error('Beneficiario no encontrado.', 404);

    $b = body();
    if (empty($b['celular']) && !empty($b['telefono'])) $b['celular'] = $b['telefono'];

    $allowed = ['nombres','apellidos','fecha_nacimiento','sexo','estado_civil','idioma_principal',
                'region','provincia','distrito','comunidad','altitud_residencia','tipo_seguro',
                'numero_afiliacion','celular','grupo_sanguineo','rh_factor','peso_kg','talla_cm'];

    $fields = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $fields[$f] = $b[$f];
        }
    }

    if (!empty($fields['fecha_nacimiento'])) {
        $fields['edad_calculada'] = (int)date_diff(date_create($fields['fecha_nacimiento']), date_create('today'))->y;
    }

    // Filtrar columnas existentes en BD
    try {
        $colsStmt = db()->query("SHOW COLUMNS FROM beneficiarios");
        if ($colsStmt) {
            $existingCols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
            $fields = array_intersect_key($fields, array_flip($existingCols));
        }
    } catch (\Throwable $e) {}

    if (!empty($fields)) {
        $fields['updated_at'] = now_str();
        $set = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($fields)));
        $params = array_combine(array_map(fn($k) => ":$k", array_keys($fields)), array_values($fields));
        $params[':id'] = $id;
        db()->prepare("UPDATE beneficiarios SET $set WHERE id = :id")->execute($params);
    }

    // Si viene información de triaje modificada (por médico o admin), persistirla
    if (!empty($b['triaje']) && is_array($b['triaje'])) {
        $tri = $b['triaje'];
        // Obtener la última atención del paciente o crear una si no existe
        $stmtAtn = db()->prepare("SELECT id FROM atenciones WHERE beneficiario_id = :bid ORDER BY id DESC LIMIT 1");
        $stmtAtn->execute([':bid' => $id]);
        $atn = $stmtAtn->fetch();
        $atencionId = $atn ? (int)$atn['id'] : null;

        if (!$atencionId) {
            db()->prepare("INSERT INTO atenciones (beneficiario_id, campaign_id, ticket_number, arrival_time, status, created_at, updated_at) VALUES (:bid, 1, 101, NOW(), 'en_triaje', NOW(), NOW())")->execute([':bid' => $id]);
            $atencionId = (int)db()->lastInsertId();
        }

        $checkTri = db()->prepare("SELECT id FROM triajes WHERE atencion_id = :aid");
        $checkTri->execute([':aid' => $atencionId]);
        $existingTri = $checkTri->fetch();

        $peso = !empty($tri['peso_kg']) ? (float)$tri['peso_kg'] : null;
        $talla = !empty($tri['talla_cm']) ? (float)$tri['talla_cm'] : null;
        $imc = null;
        if ($peso && $talla && $talla > 0) {
            $t = $talla / 100;
            $imc = round($peso / ($t * $t), 1);
        }

        $triFields = [
            'atencion_id'             => $atencionId,
            'temperatura_c'           => $tri['temperatura_c'] ?? null,
            'presion_sistolica'       => $tri['presion_sistolica'] ?? null,
            'presion_diastolica'      => $tri['presion_diastolica'] ?? null,
            'frecuencia_cardiaca'     => $tri['frecuencia_cardiaca'] ?? null,
            'frecuencia_respiratoria' => $tri['frecuencia_respiratoria'] ?? null,
            'saturacion_o2_pct'       => $tri['saturacion_o2_pct'] ?? null,
            'glucosa_mg_dl'           => $tri['glucosa_mg_dl'] ?? null,
            'peso_kg'                 => $peso,
            'talla_cm'                => $talla,
            'imc'                     => $imc,
            'prioridad'               => $tri['prioridad'] ?? 'II',
            'prioridad_label'         => $tri['prioridad_label'] ?? null,
            'prioridad_color'         => $tri['prioridad_color'] ?? 'amarillo',
            'observaciones_triaje'    => $tri['observaciones_triaje'] ?? null,
            'updated_at'              => now_str(),
        ];

        try {
            $colsTri = db()->query("SHOW COLUMNS FROM triajes")->fetchAll(PDO::FETCH_COLUMN);
            $triFields = array_intersect_key($triFields, array_flip($colsTri));
        } catch (\Throwable $e) {}

        if ($existingTri) {
            $setTri = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($triFields)));
            $pTri = array_combine(array_map(fn($k) => ":$k", array_keys($triFields)), array_values($triFields));
            $pTri[':id'] = $existingTri['id'];
            db()->prepare("UPDATE triajes SET $setTri WHERE id = :id")->execute($pTri);
        } else {
            $triFields['created_at'] = now_str();
            $cols = implode(', ', array_keys($triFields));
            $vals = implode(', ', array_map(fn($k) => ":$k", array_keys($triFields)));
            $pTri = array_combine(array_map(fn($k) => ":$k", array_keys($triFields)), array_values($triFields));
            db()->prepare("INSERT INTO triajes ($cols) VALUES ($vals)")->execute($pTri);
        }
    }

    beneficiarios_show($id);
}
