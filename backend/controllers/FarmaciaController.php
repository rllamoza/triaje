<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Farmacia y Dispensación
// Gestión de entrega de recetas, descuento de stock y cargos
// ============================================================

require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Helpers.php';
require_once __DIR__ . '/../core/ESCPOSService.php';
require_once __DIR__ . '/MedicamentoController.php';

function farmacia_ensure_schema(): void {
    static $done = false;
    if ($done) return;
    $done = true;

    med_ensure_schema();

    $pdo = db();
    $pdo->exec("CREATE TABLE IF NOT EXISTS medicamento_dispensaciones (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        campaign_id BIGINT UNSIGNED NOT NULL,
        atencion_id BIGINT UNSIGNED DEFAULT NULL,
        beneficiario_id BIGINT UNSIGNED DEFAULT NULL,
        paciente_nombre VARCHAR(255) NOT NULL,
        paciente_dni VARCHAR(20) DEFAULT NULL,
        medico_id BIGINT UNSIGNED DEFAULT NULL,
        medico_nombre VARCHAR(200) NOT NULL,
        items JSON NOT NULL,
        modalidad_cargo ENUM('firma', 'foto', 'ambos', 'ninguno') NOT NULL DEFAULT 'firma',
        firma_base64 LONGTEXT DEFAULT NULL,
        foto_url LONGTEXT DEFAULT NULL,
        impreso TINYINT(1) NOT NULL DEFAULT 0,
        observaciones TEXT DEFAULT NULL,
        dispensado_por BIGINT UNSIGNED DEFAULT NULL,
        dispensado_por_nombre VARCHAR(150) DEFAULT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_disp_camp (campaign_id),
        KEY idx_disp_atencion (atencion_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function farmacia_active_campaign_id(): int {
    $cid = (int)(get_param('campaign_id') ?? (body()['campaign_id'] ?? 0));
    if (!$cid) {
        $cid = (int)db()->query("SELECT id FROM campaigns ORDER BY (status = 'active') DESC, id DESC LIMIT 1")->fetchColumn();
    }
    return $cid ?: 1;
}

/**
 * Listado de medicamentos para el grid de farmacia con stock actual
 */
function farmacia_medicamentos(): void {
    farmacia_ensure_schema();
    $cid = farmacia_active_campaign_id();
    $q = trim((string)get_param('q', ''));

    $sql = "SELECT id, codigo, clasificacion, uso, nombre_generico, nombre_comercial, concentracion, forma_farmaceutica,
                   via_administracion, stock_actual, stock_minimo, activo, origen, updated_at
            FROM medicamentos 
            WHERE campaign_id = :cid AND activo = 1";
    $params = [':cid' => $cid];

    if ($q !== '') {
        $sql .= " AND (nombre_generico LIKE :a OR nombre_comercial LIKE :b OR codigo LIKE :c OR concentracion LIKE :d OR forma_farmaceutica LIKE :e OR via_administracion LIKE :f OR clasificacion LIKE :g OR uso LIKE :h)";
        $like = "%$q%";
        $params += [':a' => $like, ':b' => $like, ':c' => $like, ':d' => $like, ':e' => $like, ':f' => $like, ':g' => $like, ':h' => $like];
    }

    $sql .= " ORDER BY nombre_generico ASC";
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    json_ok($stmt->fetchAll());
}

/**
 * Obtener pacientes en espera de farmacia o con receta emitida
 */
function farmacia_atenciones(): void {
    farmacia_ensure_schema();
    $cid = farmacia_active_campaign_id();

    $stmt = db()->prepare("
        SELECT a.id as atencion_id, a.ticket_codigo, a.ticket_number, a.status, a.arrival_time,
               b.id as beneficiario_id, b.dni, b.nombres, b.apellidos, b.comunidad, b.edad_calculada, b.sexo,
               co.id as consulta_id, co.medico_id, co.diagnosticos, co.receta, co.indicaciones, co.signed_at,
               COALESCE(CONCAT(u.name, ' ', u.apellidos), a.specialty_name, 'Médico de Campaña') as medico_nombre,
               u.cmp_code as medico_cmp
        FROM atenciones a
        JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN consultas co ON co.atencion_id = a.id
        LEFT JOIN users u ON u.id = co.medico_id OR u.id = a.medico_id
        WHERE a.campaign_id = :cid
          AND (a.status IN ('en_farmacia', 'en_consulta', 'finalizado') OR co.receta IS NOT NULL)
        ORDER BY a.id DESC
        LIMIT 60
    ");
    $stmt->execute([':cid' => $cid]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        if (!empty($r['receta']) && is_string($r['receta'])) {
            $r['receta'] = json_decode($r['receta'], true) ?: [];
        }
        if (!empty($r['diagnosticos']) && is_string($r['diagnosticos'])) {
            $r['diagnosticos'] = json_decode($r['diagnosticos'], true) ?: [];
        }
    }

    json_ok($rows);
}

/**
 * Procesar la dispensación, descontar stock en BD y registrar cargo (firma o foto)
 */
function farmacia_dispensar(array $user): void {
    farmacia_ensure_schema();
    $b = body();

    $cid = (int)($b['campaign_id'] ?? farmacia_active_campaign_id());
    $pacienteNombre = trim((string)($b['paciente_nombre'] ?? ''));
    $medicoNombre = trim((string)($b['medico_nombre'] ?? 'Médico Asignado'));
    $items = $b['items'] ?? [];

    if (empty($pacienteNombre)) {
        json_error("El nombre del paciente es obligatorio.", 422);
    }
    if (empty($medicoNombre)) {
        json_error("El médico que dio la receta es obligatorio.", 422);
    }
    if (empty($items) || !is_array($items)) {
        json_error("Debe agregar al menos un medicamento para dispensar.", 422);
    }

    $atencionId = !empty($b['atencion_id']) ? (int)$b['atencion_id'] : null;
    $beneficiarioId = !empty($b['beneficiario_id']) ? (int)$b['beneficiario_id'] : null;
    $pacienteDni = !empty($b['paciente_dni']) ? trim((string)$b['paciente_dni']) : null;
    $medicoId = !empty($b['medico_id']) ? (int)$b['medico_id'] : null;
    $modalidadCargo = in_array($b['modalidad_cargo'] ?? '', ['firma', 'foto', 'ambos', 'ninguno']) ? $b['modalidad_cargo'] : 'firma';
    $firmaBase64 = !empty($b['firma_base64']) ? $b['firma_base64'] : null;
    $fotoUrl = !empty($b['foto_url']) ? $b['foto_url'] : (!empty($b['foto_base64']) ? $b['foto_base64'] : null);
    $imprimirCargo = filter_var($b['imprimir_cargo'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $observaciones = !empty($b['observaciones']) ? trim((string)$b['observaciones']) : null;

    $pdo = db();
    $pdo->beginTransaction();

    try {
        $deductedItems = [];

        foreach ($items as $item) {
            $medId = (int)($item['medicamento_id'] ?? 0);
            $cant  = (int)($item['cantidad'] ?? 0);

            if ($medId <= 0 || $cant <= 0) {
                continue;
            }

            // Bloquear fila para asegurar consistencia de stock en concurrencia
            $checkStmt = $pdo->prepare("SELECT id, nombre_generico, concentracion, forma_farmaceutica, stock_actual FROM medicamentos WHERE id = :id FOR UPDATE");
            $checkStmt->execute([':id' => $medId]);
            $medRow = $checkStmt->fetch();

            if (!$medRow) {
                throw new Exception("El medicamento con ID {$medId} no existe en el catálogo.");
            }

            if ((int)$medRow['stock_actual'] < $cant) {
                throw new Exception("Stock insuficiente para '{$medRow['nombre_generico']} {$medRow['concentracion']}'. Stock disponible: {$medRow['stock_actual']}, solicitado: {$cant}.");
            }

            // Descontar stock
            $updateStmt = $pdo->prepare("UPDATE medicamentos SET stock_actual = stock_actual - :cant, stock_updated_at = NOW(), updated_at = NOW() WHERE id = :id");
            $updateStmt->execute([':cant' => $cant, ':id' => $medId]);

            $deductedItems[] = [
                'medicamento_id' => $medId,
                'nombre' => $medRow['nombre_generico'],
                'concentracion' => $medRow['concentracion'],
                'forma' => $medRow['forma_farmaceutica'],
                'cantidad' => $cant,
                'dosis' => $item['dosis'] ?? '',
                'indicaciones' => $item['indicaciones'] ?? '',
                'stock_restante' => ((int)$medRow['stock_actual'] - $cant),
            ];
        }

        if (empty($deductedItems)) {
            throw new Exception("No se especificaron cantidades válidas para descontar del stock.");
        }

        // Registrar dispensación
        $insDisp = $pdo->prepare("
            INSERT INTO medicamento_dispensaciones (
                campaign_id, atencion_id, beneficiario_id, paciente_nombre, paciente_dni,
                medico_id, medico_nombre, items, modalidad_cargo, firma_base64, foto_url,
                impreso, observaciones, dispensado_por, dispensado_por_nombre, created_at, updated_at
            ) VALUES (
                :cid, :atId, :benId, :pNom, :pDni,
                :medId, :medNom, :itemsJson, :modalidad, :firma, :foto,
                :impreso, :obs, :dispPor, :dispNom, NOW(), NOW()
            )
        ");

        $dispensadorNombre = trim(($user['name'] ?? '') . ' ' . ($user['apellidos'] ?? ''));
        $insDisp->execute([
            ':cid' => $cid,
            ':atId' => $atencionId,
            ':benId' => $beneficiarioId,
            ':pNom' => $pacienteNombre,
            ':pDni' => $pacienteDni,
            ':medId' => $medicoId,
            ':medNom' => $medicoNombre,
            ':itemsJson' => json_encode($deductedItems, JSON_UNESCAPED_UNICODE),
            ':modalidad' => $modalidadCargo,
            ':firma' => $firmaBase64,
            ':foto' => $fotoUrl,
            ':impreso' => $imprimirCargo ? 1 : 0,
            ':obs' => $observaciones,
            ':dispPor' => $user['id'] ?? null,
            ':dispNom' => $dispensadorNombre ?: 'Farmacia de Campaña',
        ]);
        $dispensacionId = (int)$pdo->lastInsertId();

        // Actualizar atención a 'finalizado' si correspondía
        if ($atencionId) {
            $pdo->prepare("UPDATE atenciones SET status = 'finalizado', updated_at = NOW() WHERE id = :id")
                ->execute([':id' => $atencionId]);
        }

        $pdo->commit();

        // Auditoría
        if (function_exists('audit_log')) {
            audit_log('DISPENSACION_MEDICAMENTOS', "Dispensación #{$dispensacionId} para {$pacienteNombre}. Items: " . count($deductedItems), $user['id'] ?? 1);
        }

        json_ok([
            'status' => 'success',
            'message' => 'Medicamentos dispensados y stock descontado exitosamente.',
            'dispensacion_id' => $dispensacionId,
            'items' => $deductedItems,
            'imprimir_cargo' => $imprimirCargo,
        ]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_error("Error al procesar dispensación: " . $e->getMessage(), 422);
    }
}

/**
 * Historial de dispensaciones de la campaña
 */
function farmacia_dispensaciones(): void {
    farmacia_ensure_schema();
    $cid = farmacia_active_campaign_id();
    $page = max(1, (int)get_param('page', 1));
    $perPage = min(100, max(10, (int)get_param('per_page', 25)));

    $sql = "SELECT id, campaign_id, atencion_id, beneficiario_id, paciente_nombre, paciente_dni,
                   medico_nombre, items, modalidad_cargo, impreso, observaciones,
                   dispensado_por_nombre, created_at
            FROM medicamento_dispensaciones
            WHERE campaign_id = :cid
            ORDER BY id DESC";

    $res = paginate($sql, [':cid' => $cid], $perPage, $page);
    foreach ($res['data'] as &$row) {
        if (!empty($row['items']) && is_string($row['items'])) {
            $row['items'] = json_decode($row['items'], true) ?: [];
        }
    }
    json_ok($res);
}

