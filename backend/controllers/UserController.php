<?php
// ============================================================
// SEMILLA TRIAJE - Controlador de Usuarios
// ============================================================

function users_index(): void {
    $role   = get_param('role');
    $active = get_param('active');

    $where  = [];
    $params = [];

    if ($role !== null && $role !== '') {
        $where[]       = "role = :role";
        $params[':role'] = $role;
    }
    if ($active !== null && $active !== '') {
        $where[]         = "active = :active";
        $params[':active'] = (int)(bool)$active;
    }

    $wc = $where ? "WHERE " . implode(' AND ', $where) : '';
    $stmt = db()->prepare("
        SELECT id, name, apellidos, cmp_code, dni, role, station_default, active, last_login_at
        FROM users $wc
        ORDER BY apellidos
    ");
    $stmt->execute($params);
    json_ok($stmt->fetchAll());
}

function users_store(): void {
    $b = body();
    $required = ['name','email','password','role'];
    foreach ($required as $f) {
        if (empty($b[$f])) json_error("El campo '$f' es obligatorio.", 422);
    }
    $validRoles = ['admin','medico','triaje','admision','guardia'];
    if (!in_array($b['role'], $validRoles)) json_error('Rol inválido.', 422);

    // Verificar email único
    $check = db()->prepare("SELECT id FROM users WHERE email = :email");
    $check->execute([':email' => $b['email']]);
    if ($check->fetch()) json_error('El email ya está registrado.', 422);

    // Verificar cmp_code único si viene
    if (!empty($b['cmp_code'])) {
        $check2 = db()->prepare("SELECT id FROM users WHERE cmp_code = :cmp");
        $check2->execute([':cmp' => $b['cmp_code']]);
        if ($check2->fetch()) json_error('El código CMP ya está registrado.', 422);
    }

    $pinHash = null;
    if (!empty($b['pin'])) {
        if (strlen($b['pin']) !== 4) json_error('El PIN debe tener 4 dígitos.', 422);
        $pinHash = password_hash_app($b['pin']);
    }

    db()->prepare("
        INSERT INTO users (name, apellidos, email, password, cmp_code, dni, role, pin_hash, station_default, active, created_at, updated_at)
        VALUES (:name, :ape, :email, :pass, :cmp, :dni, :role, :pin, :station, 1, NOW(), NOW())
    ")->execute([
        ':name'    => $b['name'],
        ':ape'     => $b['apellidos'] ?? null,
        ':email'   => $b['email'],
        ':pass'    => password_hash_app($b['password']),
        ':cmp'     => $b['cmp_code'] ?? null,
        ':dni'     => $b['dni'] ?? null,
        ':role'    => $b['role'],
        ':pin'     => $pinHash,
        ':station' => $b['station_default'] ?? null,
    ]);

    $id = db()->lastInsertId();
    $stmt = db()->prepare("SELECT id, name, apellidos, cmp_code, dni, role, station_default, active FROM users WHERE id = :id");
    $stmt->execute([':id' => $id]);
    json_ok($stmt->fetch(), 201);
}

function users_show(int $id): void {
    $stmt = db()->prepare("SELECT id, name, apellidos, cmp_code, dni, role, station_default, active, last_login_at FROM users WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $u = $stmt->fetch();
    if (!$u) json_error('Usuario no encontrado.', 404);
    json_ok($u);
}

function users_update(int $id): void {
    $b = body();
    $allowed = ['name','apellidos','role','station_default','active','cmp_code'];
    $set = []; $params = [':id' => $id];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $b)) {
            $set[] = "$f = :$f";
            $params[":$f"] = $b[$f];
        }
    }
    if (!$set) json_error('Nada que actualizar.', 422);
    $set[] = "updated_at = NOW()";
    db()->prepare("UPDATE users SET " . implode(', ', $set) . " WHERE id = :id")->execute($params);
    users_show($id);
}

function users_destroy(int $id): void {
    db()->prepare("UPDATE users SET active = 0, updated_at = NOW() WHERE id = :id")->execute([':id' => $id]);
    json_ok(['message' => 'Usuario desactivado']);
}

function users_reset_pin(int $id): void {
    $b = body();
    if (empty($b['pin']) || strlen($b['pin']) !== 4) {
        json_error('El PIN debe tener exactamente 4 dígitos.', 422);
    }
    db()->prepare("UPDATE users SET pin_hash = :pin, updated_at = NOW() WHERE id = :id")
       ->execute([':pin' => password_hash_app($b['pin']), ':id' => $id]);
    json_ok(['message' => 'PIN actualizado']);
}
