<?php
// ============================================================
// SEMILLA TRIAJE - Backend PHP Puro (Sin Laravel/Framework)
// Configuración de Base de Datos y Entorno
// ============================================================

// Cargar variables desde archivo .env si existe
(function() {
    $envPath = __DIR__ . '/../.env';
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v);
                $v = trim($v, '"\'');
                if (!getenv($k) && !isset($_ENV[$k])) {
                    putenv("{$k}={$v}");
                    $_ENV[$k] = $v;
                }
            }
        }
    }
})();

function env_val(string $key, mixed $default = null): mixed {
    $val = getenv($key);
    if ($val === false || $val === '') {
        $val = $_ENV[$key] ?? $default;
    }
    return $val;
}

// Configuración de BD Principal
define('DB_HOST',     env_val('DB_HOST', '127.0.0.1'));
define('DB_PORT',     env_val('DB_PORT', '3306'));
define('DB_NAME',     env_val('DB_DATABASE', 'triaje_semilla'));
define('DB_USER',     env_val('DB_USERNAME', 'root'));
define('DB_PASS',     env_val('DB_PASSWORD', 'Ra020976'));
define('DB_CHARSET',  env_val('DB_CHARSET', 'utf8mb4'));

// Clave secreta y configuración de estación/nodo
define('APP_KEY',     env_val('APP_KEY', 'semilla-triaje-secret-2025'));
define('NODE_ID',     env_val('NODE_ID', 'CUS-VALLE-04'));
define('NODE_HW',     env_val('NODE_HARDWARE', 'PHP-API Native Server v2.0'));
define('RENIEC_URL',  env_val('RENIEC_URL', 'https://api.reniec.cloud/dni/'));
define('RENIEC_TOKEN',env_val('RENIEC_TOKEN', ''));

// Configuración de BD de Auditoría Forense (audi_triaje)
define('DB2_HOST',    env_val('DB2_HOST', env_val('DB_HOST', '127.0.0.1')));
define('DB2_NAME',    env_val('DB2_DATABASE', 'audi_triaje'));
define('DB2_USER',    env_val('DB2_USERNAME', env_val('DB_USERNAME', 'root')));
define('DB2_PASS',    env_val('DB2_PASSWORD', env_val('DB_PASSWORD', 'Ra020976')));
