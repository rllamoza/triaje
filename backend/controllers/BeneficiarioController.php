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
    $sql = "SELECT b.* FROM beneficiarios b $whereClause ORDER BY b.apellidos";
    json_ok(paginate($sql, $params, $perPage, $page));
}

function beneficiarios_store(array $user): void {
    $b = body();
    $required = ['dni','nombres','apellidos','fecha_nacimiento','sexo','campaign_id'];
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

    $fields = [
        'nombres'           => $b['nombres'],
        'apellidos'         => $b['apellidos'],
        'fecha_nacimiento'  => $b['fecha_nacimiento'],
        'sexo'              => $b['sexo'],
        'estado_civil'      => $b['estado_civil'] ?? null,
        'idioma_principal'  => $b['idioma_principal'] ?? null,
        'region'            => $b['region'] ?? null,
        'provincia'         => $b['provincia'] ?? null,
        'distrito'          => $b['distrito'] ?? null,
        'comunidad'         => $b['comunidad'] ?? null,
        'altitud_residencia'=> isset($b['altitud_residencia']) ? (int)$b['altitud_residencia'] : null,
        'tipo_seguro'       => $b['tipo_seguro'] ?? null,
        'numero_afiliacion' => $b['numero_afiliacion'] ?? null,
        'celular'           => $b['celular'] ?? null,
        'grupo_sanguineo'   => $b['grupo_sanguineo'] ?? null,
        'rh_factor'         => $b['rh_factor'] ?? null,
        'peso_kg'           => $b['peso_kg'] ?? null,
        'talla_cm'          => $b['talla_cm'] ?? null,
        'edad_calculada'    => $edad,
        'imc'               => $imc,
        'reniec_verified'   => isset($b['reniec_verified']) ? (int)(bool)$b['reniec_verified'] : 0,
        'campaign_id'       => (int)$b['campaign_id'],
        'registered_by'     => $user['id'],
        'updated_at'        => now_str(),
    ];

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

    // Cargar atenciones con triaje y consulta
    $stmt2 = db()->prepare("SELECT a.*, t.prioridad, t.prioridad_color FROM atenciones a LEFT JOIN triajes t ON t.atencion_id = a.id WHERE a.beneficiario_id = :id ORDER BY a.arrival_time DESC");
    $stmt2->execute([':id' => $id]);
    $b['atenciones'] = $stmt2->fetchAll();
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
