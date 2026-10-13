<?php
// ============================================================
// SEMILLA TRIAJE - Core: Conexión PDO con reconexión automática
// ============================================================

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                ]
            );
        } catch (PDOException $e) {
            json_error("Error de conexión a la base de datos: " . $e->getMessage(), 503);
        }
    }
    return $pdo;
}

function db2(): ?PDO {
    static $pdo2 = null;
    if ($pdo2 === null) {
        try {
            $pdo2 = new PDO(
                "mysql:host=" . DB2_HOST . ";port=3306;dbname=" . DB2_NAME . ";charset=utf8mb4",
                DB2_USER,
                DB2_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            return null; // Auditoría es opcional
        }
    }
    return $pdo2;
}
