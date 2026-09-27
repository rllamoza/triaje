<?php
/**
 * Diagnóstico de Servidor de Producción - ElRond Sistema de Gestión Médica
 * Sube este archivo a tu servidor (por ejemplo en public_html/) y ábrelo desde tu navegador:
 * https://tudominio.com/check_server.php
 * 
 * NOTA DE SEGURIDAD: Elimina este archivo una vez terminada la comprobación.
 */

// 1. Extensiones requeridas y su propósito
$requiredExtensions = [
    'pdo_mysql' => [
        'name' => 'PDO MySQL',
        'desc' => 'Conexión a la base de datos MySQL (Vital para el sistema)',
    ],
    'curl' => [
        'name' => 'cURL',
        'desc' => 'Envío de correos con Brevo y consultas a RENIEC',
    ],
    'openssl' => [
        'name' => 'OpenSSL',
        'desc' => 'Cifrado de contraseñas y autenticación con tokens Sanctum',
    ],
    'mbstring' => [
        'name' => 'Mbstring',
        'desc' => 'Manejo de tildes, letra Ñ y caracteres en español / quechua',
    ],
    'fileinfo' => [
        'name' => 'FileInfo',
        'desc' => 'Validación de formatos de logotipos y documentos clínicos',
    ],
    'bcmath' => [
        'name' => 'BCMath',
        'desc' => 'Cálculos de precisión médica y hashes criptográficos',
    ],
    'tokenizer' => [
        'name' => 'Tokenizer',
        'desc' => 'Compilación interna de rutas y vistas de Laravel',
    ],
    'xml' => [
        'name' => 'XML / LibXML',
        'desc' => 'Procesamiento de datos estructurados y reportes',
    ],
    'zip' => [
        'name' => 'ZIP',
        'desc' => 'Exportación de paquetes y respaldos comprimidos de auditoría',
    ],
];

// Extensiones complementarias recomendadas
$recommendedExtensions = [
    'json'     => 'Serialización de respuestas API y datos clínicos',
    'ctype'    => 'Validación de tipos de caracteres',
    'session'  => 'Manejo de sesiones de usuario',
    'gd'       => 'Manipulación y optimización de imágenes / membretes',
];

// 2. Evaluar PHP Version
$phpVersion = phpversion();
$phpOk = version_compare($phpVersion, '8.2.0', '>=');

// 3. Evaluar Extensiones
$missingRequired = [];
$extStatus = [];

foreach ($requiredExtensions as $ext => $info) {
    $loaded = extension_loaded($ext);
    // Para pdo_mysql a veces se carga como nd_pdo_mysql o bajo pdo
    if (!$loaded && $ext === 'pdo_mysql' && extension_loaded('pdo')) {
        $drivers = PDO::getAvailableDrivers();
        if (in_array('mysql', $drivers)) {
            $loaded = true;
        }
    }
    $extStatus[$ext] = [
        'info'   => $info,
        'loaded' => $loaded,
    ];
    if (!$loaded) {
        $missingRequired[] = $info['name'];
    }
}

$recStatus = [];
foreach ($recommendedExtensions as $ext => $desc) {
    $recStatus[$ext] = [
        'loaded' => extension_loaded($ext),
        'desc'   => $desc,
    ];
}

// 4. Parámetros del Entorno
$memoryLimit = ini_get('memory_limit');
$uploadMax = ini_get('upload_max_filesize');
$postMax = ini_get('post_max_size');
$maxExecution = ini_get('max_execution_time');

$allOk = $phpOk && empty($missingRequired);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico de Servidor — ElRond</title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --surface-hover: #334155;
            --border: #334155;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --primary: #0d9488;
            --success: #10b981;
            --success-bg: rgba(16, 185, 129, 0.15);
            --danger: #ef4444;
            --danger-bg: rgba(239, 68, 68, 0.15);
            --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: var(--bg); color: var(--text); padding: 32px 16px; min-height: 100vh; display: flex; justify-content: center; }
        .container { max-width: 760px; width: 100%; }
        .header { text-align: center; margin-bottom: 28px; }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(13, 148, 136, 0.2); border: 1px solid #0d9488; color: #2dd4bf; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        h1 { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
        .subtitle { color: var(--text-muted); font-size: 14px; }
        
        .card-alert { padding: 18px 22px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px; }
        .card-alert.success { background: var(--success-bg); border: 1px solid var(--success); }
        .card-alert.danger { background: var(--danger-bg); border: 1px solid var(--danger); }
        .card-alert .icon { font-size: 28px; }
        .card-alert h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .card-alert p { font-size: 13px; color: var(--text-muted); }
        
        .box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
        .box-title { padding: 16px 20px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); font-size: 14px; font-weight: 700; color: #2dd4bf; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .list-item { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .list-item:last-child { border-bottom: none; }
        .list-info h4 { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
        .list-info p { font-size: 12px; color: var(--text-muted); }
        
        .pill { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; font-family: monospace; display: inline-flex; align-items: center; gap: 4px; }
        .pill.ok { background: var(--success-bg); color: #34d399; border: 1px solid #10b981; }
        .pill.fail { background: var(--danger-bg); color: #f87171; border: 1px solid #ef4444; }
        
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 16px 20px; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
        .stat-item { background: rgba(0,0,0,0.2); padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border); }
        .stat-label { font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
        .stat-value { font-size: 16px; font-weight: 700; color: #f8fafc; font-family: monospace; }
        
        .footer-note { text-align: center; font-size: 12px; color: #fbbf24; background: rgba(245, 158, 11, 0.1); border: 1px dashed var(--warning); padding: 12px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="badge">Diagnóstico de Entorno</span>
            <h1>ElRond Sistema de Gestión Médica</h1>
            <p class="subtitle">Verificación de requisitos de PHP y extensiones en BanaHosting</p>
        </div>

        <!-- Banner de Estado General -->
        <?php if ($allOk): ?>
            <div class="card-alert success">
                <span class="icon">✅</span>
                <div>
                    <h3>¡Tu servidor cumple con todos los requisitos!</h3>
                    <p>Todas las extensiones indispensables están activas. El backend de ElRond puede ejecutarse sin ningún inconveniente.</p>
                </div>
            </div>
        <?php else: ?>
            <div class="card-alert danger">
                <span class="icon">⚠️</span>
                <div>
                    <h3>Faltan requisitos indispensables</h3>
                    <p>Debes ingresar a tu cPanel &gt; "Select PHP Version" &gt; pestaña "Extensions" y activar las extensiones marcadas en rojo.</p>
                </div>
            </div>
        <?php endif; ?>

        <!-- Versión de PHP -->
        <div class="box">
            <div class="box-title">1. Versión del Motor PHP</div>
            <div class="list-item">
                <div class="list-info">
                    <h4>PHP Version Instalada: <?= htmlspecialchars($phpVersion) ?></h4>
                    <p>Requisito recomendado: PHP 8.2 o PHP 8.3</p>
                </div>
                <div>
                    <?php if ($phpOk): ?>
                        <span class="pill ok">✓ <?= htmlspecialchars($phpVersion) ?> (Correcto)</span>
                    <?php else: ?>
                        <span class="pill fail">✗ <?= htmlspecialchars($phpVersion) ?> (Actualizar a 8.2+)</span>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Extensiones Requeridas -->
        <div class="box">
            <div class="box-title">2. Extensiones Indispensables de ElRond</div>
            <?php foreach ($extStatus as $ext => $item): ?>
                <div class="list-item">
                    <div class="list-info">
                        <h4><?= htmlspecialchars($item['info']['name']) ?> (<code><?= htmlspecialchars($ext) ?></code>)</h4>
                        <p><?= htmlspecialchars($item['info']['desc']) ?></p>
                    </div>
                    <div>
                        <?php if ($item['loaded']): ?>
                            <span class="pill ok">✓ ACTIVA</span>
                        <?php else: ?>
                            <span class="pill fail">✗ NO ACTIVA</span>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Extensiones Complementarias -->
        <div class="box">
            <div class="box-title">3. Extensiones Complementarias</div>
            <?php foreach ($recStatus as $ext => $item): ?>
                <div class="list-item">
                    <div class="list-info">
                        <h4><code><?= htmlspecialchars($ext) ?></code></h4>
                        <p><?= htmlspecialchars($item['desc']) ?></p>
                    </div>
                    <div>
                        <?php if ($item['loaded']): ?>
                            <span class="pill ok">✓ OK</span>
                        <?php else: ?>
                            <span class="pill fail">✗ Opcional</span>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <!-- Parámetros de php.ini -->
        <div class="box">
            <div class="box-title">4. Parámetros del Entorno (php.ini)</div>
            <div class="grid-2">
                <div class="stat-item">
                    <div class="stat-label">Límite de Memoria (memory_limit)</div>
                    <div class="stat-value"><?= htmlspecialchars($memoryLimit) ?></div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Tiempo Máximo (max_execution_time)</div>
                    <div class="stat-value"><?= htmlspecialchars($maxExecution) ?>s</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Subida Máxima (upload_max_filesize)</div>
                    <div class="stat-value"><?= htmlspecialchars($uploadMax) ?></div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Post Máximo (post_max_size)</div>
                    <div class="stat-value"><?= htmlspecialchars($postMax) ?></div>
                </div>
            </div>
        </div>

        <div class="footer-note">
            🔒 <strong>Recordatorio de Seguridad:</strong> Por buenas prácticas de seguridad, elimina este archivo (<code>check_server.php</code>) de tu servidor de producción una vez que hayas terminado de verificar las extensiones.
        </div>
    </div>
</body>
</html>
