<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Beneficiarios
// ============================================================

function beneficiarios_reniec(string $dni): void {
    $dni = trim($dni);
    if (empty($dni)) {
        json_error('DNI no puede estar vacío', 422);
    }

    // 1. Buscar en la base de datos local primero
    $stmt = db()->prepare("SELECT * FROM beneficiarios WHERE dni = :dni LIMIT 1");
    $stmt->execute([':dni' => $dni]);
    $local = $stmt->fetch();

    if ($local) {
        $stHist = db()->prepare("
            SELECT a.id, a.campaign_id,
                   COALESCE(c.name, 'Campaña General') AS campaign_name,
                   COALESCE(c.code, 'CAMP') AS campaign_code,
                   COALESCE(a.specialty_name, 'Medicina General') AS specialty_name,
                   a.specialty_code,
                   a.ticket_codigo,
                   DATE(a.created_at) AS fecha,
                   a.created_at,
                   a.status
            FROM atenciones a
            LEFT JOIN campaigns c ON c.id = a.campaign_id
            WHERE a.beneficiario_id = :bid
            ORDER BY a.created_at DESC
        ");
        $stHist->execute([':bid' => $local['id']]);
        $atenciones = $stHist->fetchAll();

        $campanas = [];
        foreach ($atenciones as $at) {
            $cName = $at['campaign_name'];
            if (!isset($campanas[$cName])) {
                $campanas[$cName] = [
                    'campaign_id'    => $at['campaign_id'],
                    'campaign_name'  => $cName,
                    'campaign_code'  => $at['campaign_code'],
                    'fecha_ultima'   => $at['fecha'],
                    'especialidades' => []
                ];
            }
            $spec = $at['specialty_name'];
            if ($spec && !in_array($spec, $campanas[$cName]['especialidades'])) {
                $campanas[$cName]['especialidades'][] = $spec;
            }
        }

        json_ok([
            'found'            => true,
            'from_cache'       => true,
            'source'           => 'Padrón Comunitario',
            'data'             => $local,
            'id'               => $local['id'],
            'dni'              => $local['dni'],
            'nombres'          => $local['nombres'],
            'apellido_paterno' => explode(' ', $local['apellidos'])[0] ?? '',
            'apellido_materno' => explode(' ', $local['apellidos'])[1] ?? '',
            'apellidos'        => $local['apellidos'],
            'fecha_nacimiento' => $local['fecha_nacimiento'],
            'sexo'             => $local['sexo'],
            'region'           => $local['region'] ?? null,
            'provincia'        => $local['provincia'] ?? null,
            'distrito'         => $local['distrito'] ?? null,
            'comunidad'        => $local['comunidad'],
            'telefono'         => $local['celular'],
            'direccion'        => $local['direccion_libre'] ?? null,
            'has_history'      => !empty($atenciones),
            'historial_campanas'   => array_values($campanas),
            'historial_atenciones' => $atenciones,
        ]);
    }

    // 2. Intentar API RENIEC si son exactamente 8 dígitos
    if (preg_match('/^\d{8}$/', $dni) && RENIEC_TOKEN && RENIEC_URL) {
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

// ── Control de Historial Comunal: busca en qué campañas y especialidades se atendió el paciente
function beneficiarios_historial_comunal(string $dni): void {
    $dni = trim($dni);
    if (!preg_match('/^\d{8}$/', $dni)) {
        json_ok([
            'found'       => false,
            'has_history' => false,
            'mensaje'     => 'DNI no válido',
            'resumen'     => 'Sin atenciones previas',
            'campanas'    => [],
            'atenciones'  => []
        ]);
    }

    $stBen = db()->prepare("SELECT id, dni, nombres, apellidos, comunidad FROM beneficiarios WHERE dni = :dni LIMIT 1");
    $stBen->execute([':dni' => $dni]);
    $ben = $stBen->fetch();

    if (!$ben) {
        json_ok([
            'found'       => false,
            'has_history' => false,
            'mensaje'     => 'Paciente no registrado en padrón comunal',
            'resumen'     => 'Sin atenciones previas',
            'campanas'    => [],
            'atenciones'  => []
        ]);
    }

    $stAt = db()->prepare("
        SELECT a.id, a.campaign_id,
               COALESCE(c.name, 'Campaña General') AS campaign_name,
               COALESCE(c.code, 'CAMP') AS campaign_code,
               COALESCE(a.specialty_name, 'Medicina General') AS specialty_name,
               a.specialty_code,
               a.ticket_codigo,
               DATE(a.created_at) AS fecha,
               a.created_at,
               a.status
        FROM atenciones a
        LEFT JOIN campaigns c ON c.id = a.campaign_id
        WHERE a.beneficiario_id = :bid
        ORDER BY a.created_at DESC
    ");
    $stAt->execute([':bid' => $ben['id']]);
    $atenciones = $stAt->fetchAll();

    if (empty($atenciones)) {
        json_ok([
            'found'        => true,
            'beneficiario' => $ben,
            'has_history'  => false,
            'mensaje'      => 'Beneficiario registrado pero sin atenciones previas en campañas',
            'resumen'      => 'Sin atenciones previas',
            'campanas'     => [],
            'atenciones'   => []
        ]);
    }

    $campanas = [];
    foreach ($atenciones as $at) {
        $cName = $at['campaign_name'];
        if (!isset($campanas[$cName])) {
            $campanas[$cName] = [
                'campaign_id'    => $at['campaign_id'],
                'campaign_name'  => $cName,
                'campaign_code'  => $at['campaign_code'],
                'fecha_ultima'   => $at['fecha'],
                'especialidades' => []
            ];
        }
        $spec = $at['specialty_name'];
        if ($spec && !in_array($spec, $campanas[$cName]['especialidades'])) {
            $campanas[$cName]['especialidades'][] = $spec;
        }
    }

    $resumenPartes = [];
    foreach ($campanas as $c) {
        $specs = implode(', ', $c['especialidades']);
        $resumenPartes[] = $c['campaign_name'] . ' (' . $specs . ')';
    }
    $resumen = implode(' | ', $resumenPartes);

    json_ok([
        'found'            => true,
        'beneficiario'     => $ben,
        'has_history'      => true,
        'total_atenciones' => count($atenciones),
        'resumen'          => $resumen,
        'campanas'         => array_values($campanas),
        'atenciones'       => $atenciones
    ]);
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
    $filter     = get_param('filter'); // 'sin_dni', 'fecha_estimada', 'completos'
    $page       = max(1, (int)get_param('page', 1));
    $perPage    = min(100, max(5, (int)get_param('per_page', 20)));

    $where  = [];
    $params = [];

    if ($search) {
        $where[]        = "(b.dni LIKE :s1 OR b.nombres LIKE :s2 OR b.apellidos LIKE :s3 OR CONCAT(b.nombres, ' ', b.apellidos) LIKE :s4 OR CONCAT(b.apellidos, ' ', b.nombres) LIKE :s5)";
        $like           = "%$search%";
        $params[':s1']  = $like;
        $params[':s2']  = $like;
        $params[':s3']  = $like;
        $params[':s4']  = $like;
        $params[':s5']  = $like;
    }
    if ($campaignId) {
        $where[]           = "b.campaign_id = :cid";
        $params[':cid']    = $campaignId;
    }
    if ($filter === 'sin_dni') {
        $where[] = "(b.dni IS NULL OR TRIM(b.dni) = '')";
    } elseif ($filter === 'fecha_estimada') {
        $where[] = "b.fecha_nacimiento LIKE '%-01-01'";
    } elseif ($filter === 'completos') {
        $where[] = "(b.dni IS NOT NULL AND TRIM(b.dni) != '' AND (b.fecha_nacimiento IS NULL OR b.fecha_nacimiento NOT LIKE '%-01-01'))";
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
    $paginated = paginate($sql, $params, $perPage, $page);
    
    // Add missing_dni and is_estimated_birth markers to each item
    if (!empty($paginated['data']) && is_array($paginated['data'])) {
        foreach ($paginated['data'] as &$item) {
            $dob = $item['fecha_nacimiento'] ?? '';
            $item['missing_dni'] = empty($item['dni']);
            $item['is_estimated_birth'] = !empty($dob) && str_ends_with($dob, '-01-01');
        }
        unset($item);
    }

    json_ok($paginated);
}

// Búsqueda rápida predictiva por DNI o Apellidos / Nombres (para autocomplete en Admisión)
function beneficiarios_buscar(): void {
    $q = trim((string)get_param('q', ''));
    if (strlen($q) < 2) {
        json_ok(['total' => 0, 'data' => []]);
    }

    $sql = "
        SELECT b.id, b.dni, b.nombres, b.apellidos, b.fecha_nacimiento, b.edad_calculada,
               b.sexo, b.estado_civil, b.idioma_principal, b.region, b.provincia, b.distrito,
               b.comunidad, b.direccion_libre, b.celular, b.tipo_seguro, b.campaign_id
        FROM beneficiarios b
        WHERE b.dni LIKE :s1
           OR b.nombres LIKE :s2
           OR b.apellidos LIKE :s3
           OR CONCAT(b.nombres, ' ', b.apellidos) LIKE :s4
           OR CONCAT(b.apellidos, ' ', b.nombres) LIKE :s5
        ORDER BY 
           CASE WHEN b.dni = :exact1 THEN 1
                WHEN CONCAT(b.nombres, ' ', b.apellidos) = :exact2 THEN 2
                WHEN CONCAT(b.apellidos, ' ', b.nombres) = :exact3 THEN 3
                WHEN b.apellidos LIKE :prefix THEN 4
                ELSE 5
           END,
           b.apellidos ASC
        LIMIT 25
    ";
    $like = "%$q%";
    $prefix = "$q%";
    $stmt = db()->prepare($sql);
    $stmt->execute([
        ':s1'     => $like,
        ':s2'     => $like,
        ':s3'     => $like,
        ':s4'     => $like,
        ':s5'     => $like,
        ':exact1' => $q,
        ':exact2' => $q,
        ':exact3' => $q,
        ':prefix' => $prefix
    ]);
    $results = $stmt->fetchAll();

    $data = array_map(function($r) {
        $dob = $r['fecha_nacimiento'] ?? '';
        $r['missing_dni'] = empty($r['dni']);
        $r['is_estimated_birth'] = !empty($dob) && str_ends_with($dob, '-01-01');
        return $r;
    }, $results);

    json_ok(['total' => count($data), 'data' => $data]);
}

// Resumen estadístico del padrón (totales, faltantes de DNI, fechas estimadas)
function beneficiarios_stats(): void {
    $pdo = db();
    $total = (int)$pdo->query("SELECT COUNT(*) FROM beneficiarios")->fetchColumn();
    $sinDni = (int)$pdo->query("SELECT COUNT(*) FROM beneficiarios WHERE dni IS NULL OR TRIM(dni) = ''")->fetchColumn();
    $conDni = $total - $sinDni;
    $fechaEstimada = (int)$pdo->query("SELECT COUNT(*) FROM beneficiarios WHERE fecha_nacimiento LIKE '%-01-01'")->fetchColumn();

    json_ok([
        'total'          => $total,
        'con_dni'        => $conDni,
        'sin_dni'        => $sinDni,
        'fecha_estimada' => $fechaEstimada,
        'completos'      => max(0, $total - $sinDni - $fechaEstimada)
    ]);
}

// Carga masiva / importación de padrón desde Personalización
function beneficiarios_import_padron(array $user): void {
    $b = body();
    $records = $b['records'] ?? [];
    if (!is_array($records) || empty($records)) {
        json_error("No se enviaron registros para importar.", 422);
    }

    $campaignId = (int)($b['campaign_id'] ?? 1);
    $defaultComunidad = trim((string)($b['comunidad'] ?? 'Jose Maria Arguedas'));

    $pdo = db();
    $pdo->beginTransaction();

    $stCheckDni = $pdo->prepare("SELECT id FROM beneficiarios WHERE dni = :dni AND (nombres = :nombres OR apellidos = :apellidos) LIMIT 1");
    $stCheckName = $pdo->prepare("SELECT id FROM beneficiarios WHERE (dni IS NULL OR dni = '') AND nombres = :nombres AND apellidos = :apellidos LIMIT 1");

    $stInsert = $pdo->prepare("
        INSERT INTO beneficiarios (
            dni, nombres, apellidos, fecha_nacimiento, edad_calculada,
            sexo, idioma_principal, tipo_seguro, comunidad, direccion_libre,
            region, provincia, distrito, campaign_id, registered_by, created_at, updated_at
        ) VALUES (
            :dni, :nombres, :apellidos, :fecha_nacimiento, :edad_calculada,
            :sexo, 'espanol', 'SIS', :comunidad, :direccion_libre,
            'Cusco', 'Urubamba', 'Urubamba', :campaign_id, :registered_by, NOW(), NOW()
        )
    ");

    $stUpdate = $pdo->prepare("
        UPDATE beneficiarios SET
            dni = COALESCE(:dni, dni),
            fecha_nacimiento = COALESCE(:fecha_nacimiento, fecha_nacimiento),
            edad_calculada = COALESCE(:edad_calculada, edad_calculada),
            direccion_libre = COALESCE(:direccion_libre, direccion_libre),
            comunidad = COALESCE(:comunidad, comunidad),
            updated_at = NOW()
        WHERE id = :id
    ");

    $inserted = 0;
    $updated = 0;
    $errors = [];

    foreach ($records as $idx => $r) {
        $nomb = trim((string)($r['nombres'] ?? ''));
        $ape  = trim((string)($r['apellidos'] ?? ''));
        $rawFull = trim((string)($r['nombre_completo'] ?? ''));

        if (!$nomb && !$ape && $rawFull) {
            $words = preg_split('/\s+/', $rawFull);
            if (count($words) === 1) {
                $nomb = $words[0];
                $ape = '';
            } elseif (count($words) === 2) {
                $nomb = $words[0];
                $ape = $words[1];
            } elseif (count($words) === 3) {
                $nomb = $words[0];
                $ape = $words[1] . ' ' . $words[2];
            } else {
                $nomb = implode(' ', array_slice($words, 0, -2));
                $ape = implode(' ', array_slice($words, -2));
            }
        }

        if (empty($nomb) && empty($ape)) {
            continue;
        }

        $dni = !empty($r['dni']) ? trim((string)$r['dni']) : null;
        $dob = !empty($r['fecha_nacimiento']) ? trim((string)$r['fecha_nacimiento']) : null;
        $edad = isset($r['edad']) && is_numeric($r['edad']) ? (int)$r['edad'] : null;
        if ($dob && !$edad) {
            try {
                $edad = (int)date_diff(date_create($dob), date_create('today'))->y;
            } catch (\Throwable $e) {}
        }
        $dom = !empty($r['domicilio']) ? trim((string)$r['domicilio']) : (!empty($r['direccion_libre']) ? trim((string)$r['direccion_libre']) : null);
        $com = !empty($r['comunidad']) ? trim((string)$r['comunidad']) : $defaultComunidad;
        $sexo = in_array(strtoupper(trim((string)($r['sexo'] ?? ''))), ['M', 'F']) ? strtoupper(trim((string)$r['sexo'])) : 'O';

        $existingId = null;
        if (!empty($dni)) {
            $stCheckDni->execute([':dni' => $dni, ':nombres' => $nomb, ':apellidos' => $ape]);
            $row = $stCheckDni->fetch();
            if ($row) $existingId = $row['id'];
        } else {
            $stCheckName->execute([':nombres' => $nomb, ':apellidos' => $ape]);
            $row = $stCheckName->fetch();
            if ($row) $existingId = $row['id'];
        }

        try {
            if ($existingId) {
                $stUpdate->execute([
                    ':dni' => $dni,
                    ':fecha_nacimiento' => $dob,
                    ':edad_calculada' => $edad,
                    ':direccion_libre' => $dom,
                    ':comunidad' => $com,
                    ':id' => $existingId
                ]);
                $updated++;
            } else {
                $stInsert->execute([
                    ':dni' => $dni,
                    ':nombres' => $nomb,
                    ':apellidos' => $ape,
                    ':fecha_nacimiento' => $dob,
                    ':edad_calculada' => $edad,
                    ':sexo' => $sexo,
                    ':comunidad' => $com,
                    ':direccion_libre' => $dom,
                    ':campaign_id' => $campaignId,
                    ':registered_by' => $user['id'] ?? null
                ]);
                $inserted++;
            }
        } catch (\Throwable $e) {
            $errors[] = "Fila " . ($idx + 1) . ": " . $e->getMessage();
        }
    }

    $pdo->commit();

    json_ok([
        'success'         => true,
        'total_processed' => count($records),
        'inserted'        => $inserted,
        'updated'         => $updated,
        'errors'          => $errors
    ]);
}

function beneficiarios_store(array $user): void {
    $b = body();
    if (empty($b['campaign_id'])) $b['campaign_id'] = 1;
    if (empty($b['celular']) && !empty($b['telefono'])) $b['celular'] = $b['telefono'];

    // Únicamente nombres y apellidos son estrictamente obligatorios (DNI puede ser opcional/pendiente)
    $required = ['nombres','apellidos'];
    foreach ($required as $f) {
        if (empty(trim((string)($b[$f] ?? '')))) json_error("El campo '$f' es obligatorio.", 422);
    }

    $cleanDni = !empty($b['dni']) ? trim((string)$b['dni']) : null;

    // Fecha de nacimiento y sexo son opcionales
    $fechaNac = !empty($b['fecha_nacimiento']) ? trim((string)$b['fecha_nacimiento']) : null;
    $rawSexo  = strtoupper(trim((string)($b['sexo'] ?? '')));
    $sexo     = in_array($rawSexo, ['M', 'F', 'O']) ? $rawSexo : 'O';

    // Calcular edad e IMC si hay fecha de nacimiento
    $edad = null;
    if ($fechaNac) {
        try {
            $edad = (int)date_diff(date_create($fechaNac), date_create('today'))->y;
        } catch (\Throwable $e) {
            $edad = null;
        }
    } elseif (isset($b['edad']) && is_numeric($b['edad'])) {
        $edad = (int)$b['edad'];
    }

    $imc = null;
    if (!empty($b['peso_kg']) && !empty($b['talla_cm']) && $b['talla_cm'] > 0) {
        $t   = $b['talla_cm'] / 100;
        $imc = round($b['peso_kg'] / ($t * $t), 1);
    }

    // Buscar si existe beneficiario previo
    $existing = null;
    if (!empty($cleanDni)) {
        $check = db()->prepare("SELECT id FROM beneficiarios WHERE dni = :dni LIMIT 1");
        $check->execute([':dni' => $cleanDni]);
        $existing = $check->fetch();
    } elseif (!empty($b['id'])) {
        $check = db()->prepare("SELECT id FROM beneficiarios WHERE id = :id LIMIT 1");
        $check->execute([':id' => (int)$b['id']]);
        $existing = $check->fetch();
    }

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
        'dni'               => $cleanDni,
        'nombres'           => $b['nombres'],
        'apellidos'         => $b['apellidos'],
        'fecha_nacimiento'  => $fechaNac,
        'sexo'              => $sexo,
        'estado_civil'      => $ec,
        'idioma_principal'  => $idioma,
        'region'            => $b['region'] ?? null,
        'provincia'         => $b['provincia'] ?? null,
        'distrito'          => $b['distrito'] ?? null,
        'comunidad'         => $b['comunidad'] ?? null,
        'direccion_libre'   => $b['direccion_libre'] ?? ($b['domicilio'] ?? null),
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
        'registered_by'     => $user['id'] ?? null,
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
