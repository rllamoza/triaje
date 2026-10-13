<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Autenticación
// Rutas: /auth/login, /auth/login-pin, /auth/me, /auth/logout, /auth/node-status
// ============================================================

function auth_login(): void {
    $b = body();
    $credential = trim($b['credential'] ?? '');
    $password   = $b['password'] ?? '';

    if (!$credential || !$password) {
        json_error('Credenciales y contraseña son obligatorias.', 422);
    }

    $stmt = db()->prepare("
        SELECT * FROM users
        WHERE (cmp_code = :c1 OR dni = :c2 OR email = :c3) AND active = 1
        LIMIT 1
    ");
    $stmt->execute([':c1' => $credential, ':c2' => $credential, ':c3' => $credential]);
    $user = $stmt->fetch();

    if (!$user || !password_verify_app($password, $user['password'])) {
        json_error('Credenciales inválidas', 401);
    }

    // Actualizar last_login_at
    db()->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id")
       ->execute([':id' => $user['id']]);

    $token       = generate_token();
    $tokenHash   = hash('sha256', $token);
    $expiresAt   = date('Y-m-d H:i:s', strtotime('+8 hours'));

    db()->prepare("
        INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, expires_at, created_at, updated_at)
        VALUES ('App\\\\Models\\\\User', :uid, 'semilla-session', :hash, '[\"*\"]', :exp, NOW(), NOW())
    ")->execute([':uid' => $user['id'], ':hash' => $tokenHash, ':exp' => $expiresAt]);

    json_ok([
        'token'       => $user['id'] . '|' . $token,
        'expires_at'  => $expiresAt,
        'user'        => [
            'id'              => (int)$user['id'],
            'nombres'         => $user['name'],
            'apellidos'       => $user['apellidos'],
            'full_name'       => trim($user['name'] . ' ' . $user['apellidos']),
            'cmp_code'        => $user['cmp_code'],
            'dni'             => $user['dni'],
            'role'            => $user['role'],
            'station_default' => $b['station_id'] ?? $user['station_default'],
        ],
        'campaign_id' => isset($b['campaign_id']) ? (int)$b['campaign_id'] : null,
        'station_id'  => $b['station_id'] ?? $user['station_default'],
    ]);
}

function auth_login_pin(): void {
    $b   = body();
    $pin = $b['pin'] ?? '';

    if (!$pin || strlen($pin) !== 4) {
        json_error('PIN debe tener 4 dígitos.', 422);
    }

    $stmt = db()->prepare("SELECT * FROM users WHERE active = 1 AND pin_hash IS NOT NULL");
    $stmt->execute();
    $users = $stmt->fetchAll();

    $user = null;
    foreach ($users as $u) {
        if (password_verify_app($pin, $u['pin_hash'])) {
            $user = $u;
            break;
        }
    }

    if (!$user) {
        json_error('PIN inválido', 401);
    }

    db()->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id")
       ->execute([':id' => $user['id']]);

    $token     = generate_token();
    $tokenHash = hash('sha256', $token);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+4 hours'));

    db()->prepare("
        INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, expires_at, created_at, updated_at)
        VALUES ('App\\\\Models\\\\User', :uid, 'semilla-pin', :hash, '[\"*\"]', :exp, NOW(), NOW())
    ")->execute([':uid' => $user['id'], ':hash' => $tokenHash, ':exp' => $expiresAt]);

    json_ok([
        'token'      => $user['id'] . '|' . $token,
        'expires_at' => $expiresAt,
        'user'       => [
            'id'       => (int)$user['id'],
            'full_name'=> trim($user['name'] . ' ' . $user['apellidos']),
            'role'     => 'guardia',
        ],
        'mode' => 'pin_emergencia',
    ]);
}

function auth_me(array $user): void {
    json_ok([
        'id'              => (int)$user['id'],
        'nombres'         => $user['name'],
        'apellidos'       => $user['apellidos'],
        'full_name'       => trim($user['name'] . ' ' . $user['apellidos']),
        'cmp_code'        => $user['cmp_code'],
        'dni'             => $user['dni'],
        'role'            => $user['role'],
        'station_default' => $user['station_default'],
        'active'          => (bool)$user['active'],
        'last_login_at'   => $user['last_login_at'],
    ]);
}

function auth_logout(array $user): void {
    db()->prepare("DELETE FROM personal_access_tokens WHERE id = :id")
       ->execute([':id' => $user['token_id']]);
    json_ok(['message' => 'Sesión cerrada correctamente']);
}

function auth_node_status(): void {
    $pendingSyncCount = 0;
    try {
        $stmt = db()->query("SELECT COUNT(*) as c FROM sync_logs WHERE synced = 0");
        $pendingSyncCount = (int)($stmt->fetch()['c'] ?? 0);
    } catch (Throwable) {}

    json_ok([
        'node_id'            => NODE_ID,
        'hardware'           => NODE_HW,
        'starlink'           => true,
        'latency_ms'         => rand(32, 45),
        'battery_pct'        => 94,
        'printer'            => 'BT-POS-01',
        'printer_ok'         => true,
        'db_synced'          => $pendingSyncCount === 0,
        'pending_sync_count' => $pendingSyncCount,
        'timezone'           => 'UTC-5',
        'timestamp'          => date('c'),
    ]);
}
