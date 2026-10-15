<?php
// ============================================================
// SEMILLA TRIAJE - API REST NATIVA PHP (Sin Laravel)
// Router Central & Front Controller
// ============================================================

// 1. Cabeceras CORS universales
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, X-Client-Audit-Telemetry");
header("Content-Type: application/json; charset=UTF-8");

// Manejo preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Carga de dependencias esenciales
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Helpers.php';

// Controladores
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/CampaignController.php';
require_once __DIR__ . '/controllers/BeneficiarioController.php';
require_once __DIR__ . '/controllers/AtencionController.php';
require_once __DIR__ . '/controllers/TriajeController.php';
require_once __DIR__ . '/controllers/ConsultaController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/TicketController.php';
require_once __DIR__ . '/controllers/AuditController.php';

// 3. Normalizar la ruta solicitada
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Quitar prefijos comunes si se aloja en subcarpetas o viene con /api
$uri = preg_replace('#^/+(backend|public|api|index\.php)+#i', '', $uri);
while (preg_match('#^/(backend|public|api|index\.php)#i', $uri)) {
    $uri = preg_replace('#^/(backend|public|api|index\.php)#i', '', $uri);
}
$path = trim($uri, '/');

// Método HTTP (con soporte para override)
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
}

// 4. Registro y coincidencia de rutas
try {
    // ── RUTAS PÚBLICAS ──────────────────────────────────────────
    if ($method === 'POST' && $path === 'auth/login') {
        auth_login();
    }
    if ($method === 'POST' && $path === 'auth/login-pin') {
        auth_login_pin();
    }
    if ($method === 'GET' && $path === 'auth/node-status') {
        auth_node_status();
    }
    if ($method === 'GET' && ($path === '' || $path === 'ping')) {
        json_ok(['status' => 'ok', 'app' => 'Semilla Triaje API (PHP Nativo)', 'timestamp' => now_str()]);
    }

    // ── RUTAS PROTEGIDAS (Requieren Token Bearer) ───────────────
    $user = resolve_auth();

    // Auth
    if ($method === 'POST' && $path === 'auth/logout') {
        auth_logout($user);
    }
    if ($method === 'GET' && $path === 'auth/me') {
        auth_me($user);
    }

    // Campañas
    if ($method === 'GET' && $path === 'campaigns') {
        campaigns_index();
    }
    if ($method === 'POST' && $path === 'campaigns') {
        campaigns_store($user);
    }
    if (preg_match('#^campaigns/(\d+)$#', $path, $m)) {
        if ($method === 'GET') campaigns_show((int)$m[1]);
        if ($method === 'PUT' || $method === 'PATCH') campaigns_update((int)$m[1]);
    }
    if ($method === 'POST' && preg_match('#^campaigns/(\d+)/activate$#', $path, $m)) {
        campaigns_activate((int)$m[1]);
    }
    if ($method === 'POST' && preg_match('#^campaigns/(\d+)/close$#', $path, $m)) {
        campaigns_close((int)$m[1]);
    }
    if ($method === 'GET' && preg_match('#^campaigns/(\d+)/stats$#', $path, $m)) {
        campaigns_stats((int)$m[1]);
    }
    if ($method === 'GET' && preg_match('#^campaigns/(\d+)/stations$#', $path, $m)) {
        campaigns_stations((int)$m[1]);
    }
    if ($method === 'POST' && preg_match('#^campaigns/(\d+)/stations$#', $path, $m)) {
        campaigns_store_station((int)$m[1]);
    }
    if ($method === 'GET' && preg_match('#^campaigns/(\d+)/cola$#', $path, $m)) {
        atenciones_cola((int)$m[1]);
    }
    if ($method === 'GET' && preg_match('#^campaigns/(\d+)/cola/live$#', $path, $m)) {
        atenciones_cola_live((int)$m[1]);
    }

    // RENIEC & Duplicados
    if ($method === 'GET' && preg_match('#^reniec/(\w+)$#', $path, $m)) {
        beneficiarios_reniec($m[1]);
    }
    if ($method === 'GET' && preg_match('#^beneficiarios/check-duplicate/(\w+)$#', $path, $m)) {
        beneficiarios_check_duplicate($m[1]);
    }

    // Beneficiarios
    if ($method === 'GET' && $path === 'beneficiarios') {
        beneficiarios_index();
    }
    if ($method === 'POST' && $path === 'beneficiarios') {
        beneficiarios_store($user);
    }
    if ($method === 'GET' && preg_match('#^beneficiarios/(\d+)$#', $path, $m)) {
        beneficiarios_show((int)$m[1]);
    }
    if ($method === 'GET' && preg_match('#^beneficiarios/(\d+)/historial$#', $path, $m)) {
        beneficiarios_historial((int)$m[1]);
    }

    // Atenciones
    if ($method === 'GET' && $path === 'atenciones') {
        atenciones_index();
    }
    if ($method === 'POST' && $path === 'atenciones') {
        atenciones_store($user);
    }
    if ($method === 'GET' && preg_match('#^atenciones/(\d+)$#', $path, $m)) {
        atenciones_show((int)$m[1]);
    }
    if (($method === 'PATCH' || $method === 'PUT') && preg_match('#^atenciones/(\d+)/status$#', $path, $m)) {
        atenciones_update_status((int)$m[1]);
    }

    // Triaje
    if ($method === 'POST' && $path === 'triajes') {
        triaje_store($user);
    }
    if ($method === 'GET' && preg_match('#^triajes/atencion/(\d+)$#', $path, $m)) {
        triaje_show_by_atencion((int)$m[1]);
    }
    if (($method === 'PUT' || $method === 'PATCH') && preg_match('#^triajes/(\d+)$#', $path, $m)) {
        triaje_update((int)$m[1]);
    }
    if ($method === 'GET' && $path === 'triajes/rangos') {
        triaje_rangos();
    }

    // Consultas
    if ($method === 'POST' && $path === 'consultas') {
        consultas_store($user);
    }
    if ($method === 'GET' && preg_match('#^consultas/atencion/(\d+)$#', $path, $m)) {
        consultas_show_by_atencion((int)$m[1]);
    }
    if (($method === 'PUT' || $method === 'PATCH') && preg_match('#^consultas/(\d+)$#', $path, $m)) {
        consultas_update((int)$m[1]);
    }
    if ($method === 'POST' && preg_match('#^consultas/(\d+)/firmar$#', $path, $m)) {
        consultas_firmar((int)$m[1], $user);
    }
    if ($method === 'GET' && $path === 'medicamentos') {
        consultas_medicamentos();
    }

    // Tickets & Impresoras
    if ($method === 'POST' && $path === 'tickets/generate') {
        tickets_generate($user);
    }
    if ($method === 'POST' && $path === 'tickets/print-direct') {
        tickets_print_direct();
    }
    if ($method === 'GET' && preg_match('#^tickets/atencion/(\d+)$#', $path, $m)) {
        tickets_historial((int)$m[1]);
    }
    if ($method === 'GET' && $path === 'printers/status') {
        tickets_printer_status();
    }

    // Usuarios
    if ($method === 'GET' && $path === 'users') {
        users_index();
    }
    if ($method === 'POST' && $path === 'users') {
        users_store();
    }
    if ($method === 'GET' && preg_match('#^users/(\d+)$#', $path, $m)) {
        users_show((int)$m[1]);
    }
    if (($method === 'PUT' || $method === 'PATCH') && preg_match('#^users/(\d+)$#', $path, $m)) {
        users_update((int)$m[1]);
    }
    if ($method === 'DELETE' && preg_match('#^users/(\d+)$#', $path, $m)) {
        users_destroy((int)$m[1]);
    }
    if ($method === 'POST' && preg_match('#^users/(\d+)/reset-pin$#', $path, $m)) {
        users_reset_pin((int)$m[1]);
    }

    // Auditoría Forense y Telemetría
    if ($method === 'GET' && $path === 'admin/audit/status') {
        audit_status();
    }
    if ($method === 'POST' && $path === 'admin/audit/toggle') {
        audit_toggle();
    }
    if ($method === 'GET' && $path === 'admin/audit/logs') {
        audit_logs();
    }
    if ($method === 'GET' && preg_match('#^admin/audit/logs/(\d+)$#', $path, $m)) {
        audit_show((int)$m[1]);
    }
    if ($method === 'GET' && $path === 'admin/audit/stats') {
        audit_stats();
    }
    if ($method === 'GET' && $path === 'admin/audit/export') {
        audit_export();
    }

    // Si ninguna ruta coincidió
    json_error("Ruta no encontrada: [{$method}] /{$path}", 404);

} catch (Throwable $e) {
    json_error("Error interno del servidor: " . $e->getMessage(), 500);
}
