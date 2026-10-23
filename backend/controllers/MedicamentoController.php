<?php
// ============================================================
// SEMILLA TRIAJE - Catálogo de Medicamentos de la Campaña
//   Opción A: importación desde Excel (el frontend lee el .xlsx y envía filas JSON)
//   Opción B: sincronización de stock desde una base de datos externa (MySQL)
// Ambas alimentan la tabla `medicamentos` que usan los médicos al recetar.
// ============================================================

const MED_FORMAS = ['tableta','capsula','jarabe','inyectable','crema','ovulo','solucion','otro'];
const MED_VIAS   = ['oral','IM','IV','topica','inhalada','sublingual','otro'];

function med_require_admin(array $user): void {
    if (($user['role'] ?? '') !== 'admin') json_error('Solo el administrador puede gestionar el catálogo de medicamentos.', 403);
}

function med_ensure_schema(): void {
    static $done = false;
    if ($done) return;
    $done = true;
    $pdo = db();
    $cols = $pdo->query("SHOW COLUMNS FROM medicamentos")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('codigo', $cols))           $pdo->exec("ALTER TABLE medicamentos ADD COLUMN codigo VARCHAR(60) NULL AFTER id, ADD INDEX idx_med_codigo (codigo)");
    if (!in_array('origen', $cols))           $pdo->exec("ALTER TABLE medicamentos ADD COLUMN origen VARCHAR(20) NOT NULL DEFAULT 'manual'");
    if (!in_array('stock_updated_at', $cols)) $pdo->exec("ALTER TABLE medicamentos ADD COLUMN stock_updated_at TIMESTAMP NULL DEFAULT NULL");
    if (!in_array('campaign_id', $cols)) {
        $pdo->exec("ALTER TABLE medicamentos ADD COLUMN campaign_id BIGINT UNSIGNED NULL AFTER id, ADD INDEX idx_med_campaign (campaign_id)");
        // Los medicamentos existentes pasan a la campaña activa (o a la más reciente)
        $cid = $pdo->query("SELECT id FROM campaigns ORDER BY (status = 'active') DESC, id DESC LIMIT 1")->fetchColumn();
        if ($cid) $pdo->exec("UPDATE medicamentos SET campaign_id = " . (int)$cid . " WHERE campaign_id IS NULL");
    }
    $pdo->exec("CREATE TABLE IF NOT EXISTS medicamentos_config (
        clave VARCHAR(60) NOT NULL PRIMARY KEY,
        valor TEXT NULL,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

// Campaña objetivo: parámetro campaign_id (query o body); si falta, la campaña activa.
function med_campaign_id(): int {
    med_ensure_schema();
    $cid = (int)(get_param('campaign_id') ?? (body()['campaign_id'] ?? 0));
    if (!$cid) $cid = (int)db()->query("SELECT id FROM campaigns ORDER BY (status = 'active') DESC, id DESC LIMIT 1")->fetchColumn();
    $st = db()->prepare("SELECT COUNT(*) FROM campaigns WHERE id = :i");
    $st->execute([':i' => $cid]);
    if (!$cid || !(int)$st->fetchColumn()) json_error('Campaña no válida.', 422);
    return $cid;
}

function med_norm(?string $s): string {
    $s = trim((string)$s);
    $s = mb_strtolower($s, 'UTF-8');
    return strtr($s, ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n','ü'=>'u']);
}

function med_forma(?string $v): string {
    $n = med_norm($v);
    if ($n === '') return 'otro';
    $map = [
        'tableta'=>'tableta','tab'=>'tableta','comprimido'=>'tableta','tabletas'=>'tableta',
        'capsula'=>'capsula','cap'=>'capsula','capsulas'=>'capsula',
        'jarabe'=>'jarabe','suspension'=>'jarabe',
        'inyectable'=>'inyectable','ampolla'=>'inyectable','iny'=>'inyectable','vial'=>'inyectable',
        'crema'=>'crema','pomada'=>'crema','gel'=>'crema','unguento'=>'crema',
        'ovulo'=>'ovulo','solucion'=>'solucion','gotas'=>'solucion','sobre'=>'solucion','sachet'=>'solucion',
        'otro'=>'otro',
    ];
    return $map[$n] ?? 'otro';
}

function med_via(?string $v): string {
    $n = med_norm($v);
    if ($n === '') return 'oral';
    $map = [
        'oral'=>'oral','vo'=>'oral','im'=>'IM','intramuscular'=>'IM','iv'=>'IV','ev'=>'IV','endovenosa'=>'IV','intravenosa'=>'IV',
        'topica'=>'topica','topico'=>'topica','cutanea'=>'topica','inhalada'=>'inhalada','inhalatoria'=>'inhalada',
        'sublingual'=>'sublingual','sl'=>'sublingual','otro'=>'otro',
    ];
    return $map[$n] ?? 'otro';
}

function med_int($v, int $default = 0): int {
    if ($v === null || $v === '') return $default;
    if (is_string($v)) $v = str_replace([',', ' '], '', $v);
    return is_numeric($v) ? max(0, (int)round((float)$v)) : $default;
}

// ── Listado completo para el administrador ───────────────────
function medicamentos_admin_index(array $user): void {
    med_require_admin($user);
    $cid = med_campaign_id();
    $q = trim((string)get_param('q', ''));
    $sql = "SELECT id, codigo, nombre_generico, nombre_comercial, concentracion, forma_farmaceutica,
                   via_administracion, stock_actual, stock_minimo, activo, origen, stock_updated_at, updated_at
            FROM medicamentos WHERE campaign_id = :cid";
    $params = [':cid' => $cid];
    if ($q !== '') {
        $sql .= " AND (nombre_generico LIKE :a OR nombre_comercial LIKE :b OR codigo LIKE :c)";
        $like = "%$q%";
        $params += [':a' => $like, ':b' => $like, ':c' => $like];
    }
    $stmt = db()->prepare($sql . " ORDER BY nombre_generico, concentracion LIMIT 2000");
    $stmt->execute($params);
    json_ok($stmt->fetchAll());
}

// ── Opción A: importar filas desde Excel ─────────────────────
function medicamentos_import(array $user): void {
    med_require_admin($user);
    $cid = med_campaign_id();
    $b = body();
    $items = $b['items'] ?? null;
    if (!is_array($items) || count($items) === 0) json_error('El archivo no contiene medicamentos.', 422);
    if (count($items) > 5000) json_error('Máximo 5000 filas por importación.', 422);
    $modo = ($b['modo'] ?? 'actualizar') === 'reemplazar' ? 'reemplazar' : 'actualizar';

    $pdo = db();
    $creados = 0; $actualizados = 0; $errores = [];
    $touched = [];

    $pdo->beginTransaction();
    try {
        $findCod = $pdo->prepare("SELECT id FROM medicamentos WHERE codigo = :c AND campaign_id = $cid LIMIT 1");
        $findNom = $pdo->prepare("SELECT id FROM medicamentos WHERE nombre_generico = :n AND campaign_id = $cid
                                  AND COALESCE(concentracion,'') = :c AND forma_farmaceutica = :f LIMIT 1");
        $ins = $pdo->prepare("INSERT INTO medicamentos
            (campaign_id, codigo, nombre_generico, nombre_comercial, concentracion, forma_farmaceutica, via_administracion,
             stock_actual, stock_minimo, activo, origen, stock_updated_at, created_at, updated_at)
            VALUES ($cid,:codigo,:gen,:com,:conc,:forma,:via,:stock,:min,:activo,'excel',NOW(),NOW(),NOW())");
        $upd = $pdo->prepare("UPDATE medicamentos SET codigo = COALESCE(:codigo, codigo), nombre_generico = :gen,
            nombre_comercial = :com, concentracion = :conc, forma_farmaceutica = :forma, via_administracion = :via,
            stock_actual = :stock, stock_minimo = :min, activo = :activo, origen = 'excel',
            stock_updated_at = NOW(), updated_at = NOW() WHERE id = :id");

        foreach ($items as $i => $it) {
            $fila = $i + 2; // fila en Excel (1 = encabezado)
            $gen = trim((string)($it['nombre_generico'] ?? ''));
            if ($gen === '') { $errores[] = ['fila' => $fila, 'error' => 'Falta el nombre genérico.']; continue; }
            $codigo = trim((string)($it['codigo'] ?? ''));
            $conc   = trim((string)($it['concentracion'] ?? ''));
            $com    = trim((string)($it['nombre_comercial'] ?? ''));
            $forma  = med_forma($it['forma_farmaceutica'] ?? '');
            $via    = med_via($it['via_administracion'] ?? '');
            $stock  = med_int($it['stock_actual'] ?? 0);
            $min    = med_int($it['stock_minimo'] ?? 10, 10);
            $act    = med_norm((string)($it['activo'] ?? 'si'));
            $activo = in_array($act, ['no','0','false','inactivo'], true) ? 0 : 1;

            $id = null;
            if ($codigo !== '') {
                $findCod->execute([':c' => $codigo]);
                $id = $findCod->fetchColumn() ?: null;
            }
            if (!$id) {
                $findNom->execute([':n' => $gen, ':c' => $conc, ':f' => $forma]);
                $id = $findNom->fetchColumn() ?: null;
            }
            $p = [':gen'=>$gen, ':com'=>$com ?: null, ':conc'=>$conc ?: null, ':forma'=>$forma, ':via'=>$via,
                  ':stock'=>$stock, ':min'=>$min, ':activo'=>$activo, ':codigo'=>$codigo ?: null];
            if ($id) { $p[':id'] = $id; $upd->execute($p); $actualizados++; }
            else     { $ins->execute($p); $id = $pdo->lastInsertId(); $creados++; }
            $touched[] = (int)$id;
        }

        $desactivados = 0;
        if ($modo === 'reemplazar' && $touched) {
            $in = implode(',', array_map('intval', array_unique($touched)));
            $desactivados = $pdo->exec("UPDATE medicamentos SET activo = 0, updated_at = NOW() WHERE campaign_id = $cid AND id NOT IN ($in) AND activo = 1");
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_error('No se pudo importar: ' . $e->getMessage(), 500);
    }

    json_ok([
        'creados' => $creados, 'actualizados' => $actualizados,
        'desactivados' => $desactivados, 'errores' => $errores, 'modo' => $modo,
    ]);
}

function medicamentos_update(array $user, int $id): void {
    med_require_admin($user);
    med_ensure_schema();
    $b = body();
    $set = []; $p = [':id' => $id];
    foreach (['stock_actual','stock_minimo'] as $f) {
        if (array_key_exists($f, $b)) { $set[] = "$f = :$f"; $p[":$f"] = med_int($b[$f]); }
    }
    if (array_key_exists('activo', $b)) { $set[] = "activo = :activo"; $p[':activo'] = $b['activo'] ? 1 : 0; }
    if (!$set) json_error('Nada que actualizar.', 422);
    if (array_key_exists('stock_actual', $b)) $set[] = "stock_updated_at = NOW()";
    db()->prepare("UPDATE medicamentos SET " . implode(', ', $set) . ", updated_at = NOW() WHERE id = :id")->execute($p);
    json_ok(['message' => 'Medicamento actualizado.']);
}

// ── Opción B: sincronización de stock con BD externa ─────────
function med_crypt(string $plain): string {
    if ($plain === '') return '';
    $key = hash('sha256', APP_KEY, true);
    $iv = random_bytes(16);
    return base64_encode($iv . openssl_encrypt($plain, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv));
}

function med_decrypt(string $enc): string {
    if ($enc === '') return '';
    $raw = base64_decode($enc, true);
    if ($raw === false || strlen($raw) < 17) return '';
    $key = hash('sha256', APP_KEY, true);
    return (string)openssl_decrypt(substr($raw, 16), 'aes-256-cbc', $key, OPENSSL_RAW_DATA, substr($raw, 0, 16));
}

// Configuración de sincronización: una por campaña (claves con prefijo "{campaign_id}:")
function med_get_config(int $cid): array {
    med_ensure_schema();
    $st = db()->prepare("SELECT clave, valor FROM medicamentos_config WHERE clave LIKE :p");
    $st->execute([':p' => "$cid:%"]);
    $rows = [];
    foreach ($st->fetchAll(PDO::FETCH_KEY_PAIR) as $k => $v) $rows[substr($k, strlen("$cid:"))] = $v;
    return array_merge([
        'host' => '', 'port' => '3306', 'database' => '', 'username' => '', 'password_enc' => '',
        'table' => '', 'col_codigo' => 'codigo', 'col_stock' => 'stock',
        'last_sync_at' => '', 'last_sync_result' => '',
    ], $rows);
}

function med_set_config(int $cid, string $k, string $v): void {
    db()->prepare("INSERT INTO medicamentos_config (clave, valor) VALUES (:k, :v)
                   ON DUPLICATE KEY UPDATE valor = VALUES(valor)")->execute([':k' => "$cid:$k", ':v' => $v]);
}

// Copiar el catálogo de otra campaña hacia la campaña destino (sin duplicar lo que ya exista)
function medicamentos_copy(array $user): void {
    med_require_admin($user);
    $to = med_campaign_id();
    $from = (int)(body()['from_campaign_id'] ?? 0);
    if (!$from || $from === $to) json_error('Seleccione una campaña de origen distinta.', 422);
    $withStock = !empty(body()['con_stock']);
    $stockExpr = $withStock ? 's.stock_actual' : '0';
    $n = db()->exec("INSERT INTO medicamentos
        (campaign_id, codigo, nombre_generico, nombre_comercial, concentracion, forma_farmaceutica, via_administracion,
         stock_actual, stock_minimo, activo, origen, created_at, updated_at)
        SELECT $to, s.codigo, s.nombre_generico, s.nombre_comercial, s.concentracion, s.forma_farmaceutica, s.via_administracion,
               $stockExpr, s.stock_minimo, s.activo, 'copia', NOW(), NOW()
        FROM medicamentos s WHERE s.campaign_id = " . $from . " AND s.activo = 1
          AND NOT EXISTS (SELECT 1 FROM medicamentos d WHERE d.campaign_id = $to AND d.nombre_generico = s.nombre_generico
                          AND COALESCE(d.concentracion,'') = COALESCE(s.concentracion,'') AND d.forma_farmaceutica = s.forma_farmaceutica)");
    json_ok(['copiados' => (int)$n]);
}

function medicamentos_sync_config_get(array $user): void {
    med_require_admin($user);
    $c = med_get_config(med_campaign_id());
    $c['has_password'] = $c['password_enc'] !== '';
    unset($c['password_enc']);
    json_ok($c);
}

function medicamentos_sync_config_save(array $user): void {
    med_require_admin($user);
    $cid = med_campaign_id();
    $b = body();
    foreach (['host','database','username','table','col_codigo','col_stock'] as $k) {
        if (isset($b[$k])) med_set_config($cid, $k, trim((string)$b[$k]));
    }
    if (isset($b['port'])) med_set_config($cid, 'port', (string)(int)$b['port']);
    if (!empty($b['password'])) med_set_config($cid, 'password_enc', med_crypt((string)$b['password']));
    json_ok(['message' => 'Configuración de sincronización guardada.']);
}

function med_ident(string $s, string $label): string {
    if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $s)) json_error("Nombre inválido en '$label' (solo letras, números y guion bajo).", 422);
    return "`$s`";
}

function med_external_pdo(array $c): PDO {
    if ($c['host'] === '' || $c['database'] === '' || $c['username'] === '') {
        json_error('Complete servidor, base de datos y usuario de la conexión externa.', 422);
    }
    try {
        return new PDO(
            "mysql:host={$c['host']};port=" . (int)$c['port'] . ";dbname={$c['database']};charset=utf8mb4",
            $c['username'], med_decrypt($c['password_enc']),
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_TIMEOUT => 8]
        );
    } catch (PDOException $e) {
        json_error('No se pudo conectar a la base externa: ' . $e->getMessage(), 502);
    }
}

function medicamentos_sync_test(array $user): void {
    med_require_admin($user);
    $c = med_get_config(med_campaign_id());
    $ext = med_external_pdo($c);
    $t = med_ident($c['table'], 'tabla'); $cc = med_ident($c['col_codigo'], 'columna código'); $cs = med_ident($c['col_stock'], 'columna stock');
    try {
        $total = (int)$ext->query("SELECT COUNT(*) FROM $t")->fetchColumn();
        $muestra = $ext->query("SELECT $cc AS codigo, $cs AS stock FROM $t LIMIT 5")->fetchAll();
    } catch (PDOException $e) {
        json_error('Conexión correcta, pero la consulta falló: ' . $e->getMessage(), 422);
    }
    json_ok(['message' => 'Conexión exitosa.', 'total_filas' => $total, 'muestra' => $muestra]);
}

function medicamentos_sync_run(array $user): void {
    med_require_admin($user);
    $cid = med_campaign_id();
    $c = med_get_config($cid);
    $ext = med_external_pdo($c);
    $t = med_ident($c['table'], 'tabla'); $cc = med_ident($c['col_codigo'], 'columna código'); $cs = med_ident($c['col_stock'], 'columna stock');
    try {
        $rows = $ext->query("SELECT $cc AS codigo, $cs AS stock FROM $t")->fetchAll();
    } catch (PDOException $e) {
        json_error('La consulta a la base externa falló: ' . $e->getMessage(), 422);
    }

    $upd = db()->prepare("UPDATE medicamentos SET stock_actual = :s, stock_updated_at = NOW(), updated_at = NOW()
                          WHERE campaign_id = $cid AND codigo = :c AND (stock_actual <> :s2 OR stock_updated_at IS NULL)");
    $exists = db()->prepare("SELECT COUNT(*) FROM medicamentos WHERE campaign_id = $cid AND codigo = :c");
    $actualizados = 0; $sin_cambio = 0;
    $vistos = [];
    foreach ($rows as $r) {
        $cod = trim((string)$r['codigo']);
        if ($cod === '') continue;
        $stock = med_int($r['stock']);
        $upd->execute([':s' => $stock, ':s2' => $stock, ':c' => $cod]);
        if ($upd->rowCount() > 0) { $actualizados++; $vistos[$cod] = true; continue; }
        $exists->execute([':c' => $cod]);
        if ((int)$exists->fetchColumn() > 0) { $sin_cambio++; $vistos[$cod] = true; }
    }
    $total = (int)db()->query("SELECT COUNT(*) FROM medicamentos WHERE campaign_id = $cid AND codigo IS NOT NULL AND codigo <> ''")->fetchColumn();
    $res = [
        'actualizados' => $actualizados, 'sin_cambio' => $sin_cambio,
        'no_encontrados_en_externa' => max(0, $total - count($vistos)),
        'ignorados_fuera_de_campana' => max(0, count($rows) - count($vistos)),
    ];
    med_set_config($cid, 'last_sync_at', now_str());
    med_set_config($cid, 'last_sync_result', json_encode($res));
    json_ok($res);
}
