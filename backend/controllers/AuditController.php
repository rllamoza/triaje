<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Auditoría Forense
// Rutas: /admin/audit/*
// ============================================================

function audit_status(): void {
    $p2 = db2();
    $dbConnected  = false;
    $tableExists  = false;
    $totalRecords = 0;
    $recordsToday = 0;
    $errorRecords = 0;
    $dbSizeMb     = 0.0;
    $lastRecord   = null;
    $errorMessage = null;

    if ($p2) {
        $dbConnected = true;
        try {
            $stmt = $p2->query("SHOW TABLES LIKE 'audit_records'");
            $tableExists = (bool)$stmt->fetch();

            if ($tableExists) {
                $totalRecords = (int)$p2->query("SELECT COUNT(*) FROM audit_records")->fetchColumn();
                $recordsToday = (int)$p2->query("SELECT COUNT(*) FROM audit_records WHERE DATE(created_at) = CURDATE()")->fetchColumn();
                $errorRecords = (int)$p2->query("SELECT COUNT(*) FROM audit_records WHERE status_code >= 400")->fetchColumn();
                $lastRecord   = $p2->query("SELECT id, endpoint, method, created_at, user_name FROM audit_records ORDER BY id DESC LIMIT 1")->fetch();

                $sizeStmt = $p2->prepare("
                    SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                    FROM information_schema.TABLES
                    WHERE table_schema = :db
                ");
                $sizeStmt->execute([':db' => DB2_NAME]);
                $dbSizeMb = (float)($sizeStmt->fetch()['size_mb'] ?? 0.0);
            }
        } catch (Throwable $e) {
            $errorMessage = $e->getMessage();
        }
    }

    json_ok([
        'enabled'        => true,
        'db_connected'   => $dbConnected,
        'db_name'        => DB2_NAME,
        'table_exists'   => $tableExists,
        'total_records'  => $totalRecords,
        'records_today'  => $recordsToday,
        'error_records'  => $errorRecords,
        'db_size_mb'     => $dbSizeMb,
        'last_record'    => $lastRecord,
        'error_message'  => $errorMessage,
    ]);
}

function audit_toggle(): void {
    $b = body();
    $enabled = !empty($b['enabled']);
    json_ok([
        'success' => true,
        'enabled' => $enabled,
        'message' => $enabled ? 'Módulo de auditoría forense ACTIVADO con éxito.' : 'Módulo de auditoría forense DESACTIVADO.',
    ]);
}

function audit_logs(): void {
    $p2 = db2();
    if (!$p2) {
        json_ok(['data' => [], 'total' => 0, 'current_page' => 1, 'last_page' => 1, 'message' => 'Base de datos audi_triaje no configurada o no disponible.']);
    }

    try {
        $tableExists = (bool)$p2->query("SHOW TABLES LIKE 'audit_records'")->fetch();
        if (!$tableExists) {
            json_ok(['data' => [], 'total' => 0, 'current_page' => 1, 'last_page' => 1, 'message' => 'La tabla audit_records aún no existe.']);
        }
    } catch (Throwable) {
        json_ok(['data' => [], 'total' => 0, 'current_page' => 1, 'last_page' => 1]);
    }

    $search   = get_param('search');
    $category = get_param('category');
    $method   = get_param('method');
    $status   = get_param('status');
    $device   = get_param('device_type');
    $page     = max(1, (int)get_param('page', 1));
    $perPage  = min(max((int)get_param('per_page', 25), 10), 100);

    $where  = [];
    $params = [];

    if ($search) {
        $where[] = "(user_name LIKE :s1 OR user_dni LIKE :s2 OR endpoint LIKE :s3 OR ip_address LIKE :s4)";
        $like = "%$search%";
        $params[':s1'] = $like; $params[':s2'] = $like; $params[':s3'] = $like; $params[':s4'] = $like;
    }
    if ($category && $category !== 'TODOS') {
        $where[] = "action_category = :cat"; $params[':cat'] = $category;
    }
    if ($method && $method !== 'TODOS') {
        $where[] = "method = :met"; $params[':met'] = strtoupper($method);
    }
    if ($status === 'success') {
        $where[] = "status_code < 400";
    } elseif ($status === 'error') {
        $where[] = "status_code >= 400";
    }
    if ($device && $device !== 'TODOS') {
        $where[] = "device_type = :dev"; $params[':dev'] = $device;
    }

    $wc = $where ? "WHERE " . implode(' AND ', $where) : '';
    $sql = "SELECT * FROM audit_records $wc ORDER BY id DESC";

    $offset = ($page - 1) * $perPage;
    $countSql = "SELECT COUNT(*) as total FROM ($sql) as sub";
    $cStmt = $p2->prepare($countSql);
    $cStmt->execute($params);
    $total = (int)$cStmt->fetch()['total'];

    $dStmt = $p2->prepare("$sql LIMIT :lim OFFSET :off");
    foreach ($params as $k => $v) $dStmt->bindValue($k, $v);
    $dStmt->bindValue(':lim', $perPage, PDO::PARAM_INT);
    $dStmt->bindValue(':off', $offset, PDO::PARAM_INT);
    $dStmt->execute();

    json_ok([
        'data'         => $dStmt->fetchAll(),
        'total'        => $total,
        'per_page'     => $perPage,
        'current_page' => $page,
        'last_page'    => max(1, (int)ceil($total / $perPage)),
    ]);
}

function audit_show(int $id): void {
    $p2 = db2();
    if (!$p2) json_error('Base de auditoría no disponible.', 503);
    $stmt = $p2->prepare("SELECT * FROM audit_records WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $rec = $stmt->fetch();
    if (!$rec) json_error('Registro forense no encontrado.', 404);
    json_ok($rec);
}

function audit_stats(): void {
    $p2 = db2();
    if (!$p2) json_ok(['categories' => [], 'devices' => [], 'hourly' => []]);

    try {
        $catStmt = $p2->query("SELECT action_category, COUNT(*) as count FROM audit_records GROUP BY action_category ORDER BY count DESC");
        $categories = $catStmt ? $catStmt->fetchAll() : [];

        $devStmt = $p2->query("SELECT device_os, COUNT(*) as count FROM audit_records WHERE device_os IS NOT NULL GROUP BY device_os ORDER BY count DESC LIMIT 6");
        $devices = $devStmt ? $devStmt->fetchAll() : [];

        $hourStmt = $p2->query("SELECT HOUR(created_at) as hour, COUNT(*) as count FROM audit_records WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY hour ORDER BY hour");
        $hourly = $hourStmt ? $hourStmt->fetchAll() : [];

        json_ok([
            'categories' => $categories,
            'devices'    => $devices,
            'hourly'     => $hourly,
        ]);
    } catch (Throwable $e) {
        json_ok(['categories' => [], 'devices' => [], 'hourly' => []]);
    }
}

function audit_export(): never {
    $p2 = db2();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=auditoria_triaje_' . date('Ymd_His') . '.csv');

    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID', 'Fecha', 'Usuario', 'DNI', 'Método', 'Endpoint', 'Estado', 'IP', 'Dispositivo', 'Categoría']);

    if ($p2) {
        $stmt = $p2->query("SELECT id, created_at, user_name, user_dni, method, endpoint, status_code, ip_address, device_os, action_category FROM audit_records ORDER BY id DESC LIMIT 2000");
        while ($row = $stmt->fetch()) {
            fputcsv($out, $row);
        }
    }
    fclose($out);
    exit;
}
