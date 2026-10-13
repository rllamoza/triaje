<?php
// ============================================================
// SEMILLA TRIAJE - Core: Helpers globales de respuesta y utils
// ============================================================

function json_ok(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $code = 400, array $extra = []): never {
    http_response_code($code);
    echo json_encode(array_merge(['message' => $message], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function body(): array {
    if (isset($GLOBALS['__TEST_BODY'])) {
        return $GLOBALS['__TEST_BODY'];
    }
    static $parsed = null;
    if ($parsed === null) {
        $raw = file_get_contents('php://input');
        $parsed = json_decode($raw, true) ?? [];
        if (empty($parsed) && !empty($_POST)) {
            $parsed = $_POST;
        }
    }
    return $parsed;
}

function now_str(): string {
    return date('Y-m-d H:i:s');
}

function today_str(): string {
    return date('Y-m-d');
}

function password_hash_app(string $plain): string {
    return password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);
}

function password_verify_app(string $plain, string $hash): bool {
    return password_verify($plain, $hash);
}

function generate_token(): string {
    return bin2hex(random_bytes(40));
}

function hmac_sign(string $payload): string {
    return hash_hmac('sha256', $payload, APP_KEY);
}

function paginate(string $sql, array $params, int $perPage, int $page): array {
    $offset = ($page - 1) * $perPage;
    $countSql = "SELECT COUNT(*) as total FROM ($sql) as sub";
    $stmt = db()->prepare($countSql);
    $stmt->execute($params);
    $total = (int) $stmt->fetch()['total'];

    $stmt2 = db()->prepare("$sql LIMIT :limit OFFSET :offset");
    foreach ($params as $k => $v) $stmt2->bindValue($k, $v);
    $stmt2->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt2->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt2->execute();
    $data = $stmt2->fetchAll();

    return [
        'data'          => $data,
        'total'         => $total,
        'per_page'      => $perPage,
        'current_page'  => $page,
        'last_page'     => max(1, (int) ceil($total / $perPage)),
    ];
}

function get_param(string $key, mixed $default = null): mixed {
    return $_GET[$key] ?? $default;
}

function require_body_param(string $key): mixed {
    $b = body();
    if (!isset($b[$key]) || $b[$key] === '' || $b[$key] === null) {
        json_error("El campo '{$key}' es obligatorio.", 422);
    }
    return $b[$key];
}

function resolve_auth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($header, 'Bearer ')) {
        json_error('No autenticado. Token requerido.', 401);
    }
    $rawToken = trim(substr($header, 7));

    // Si viene en formato Sanctum "id|plainToken", extraer solo la parte del plainToken
    if (strpos($rawToken, '|') !== false) {
        list(, $plainToken) = explode('|', $rawToken, 2);
    } else {
        $plainToken = $rawToken;
    }

    $tokenHash = hash('sha256', $plainToken);

    $stmt = db()->prepare("
        SELECT u.*, pat.id as token_id, pat.token as token_hash
        FROM personal_access_tokens pat
        JOIN users u ON u.id = pat.tokenable_id
        WHERE pat.token = :token
          AND (pat.expires_at IS NULL OR pat.expires_at > NOW())
          AND u.active = 1
        LIMIT 1
    ");
    $stmt->execute([':token' => $tokenHash]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('Token inválido o expirado.', 401);
    }

    // Actualizar last_used_at
    db()->prepare("UPDATE personal_access_tokens SET last_used_at = NOW() WHERE id = :id")
        ->execute([':id' => $user['token_id']]);

    return $user;
}
