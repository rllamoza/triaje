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
            ensure_schema_compatibility($pdo);
        } catch (PDOException $e) {
            json_error("Error de conexión a la base de datos: " . $e->getMessage(), 503);
        }
    }
    return $pdo;
}

function ensure_schema_compatibility(PDO $pdo): void {
    static $checked = false;
    if ($checked) return;
    $checked = true;

    try {
        // 1. Asegurar tabla campaign_specialties
        $pdo->exec("CREATE TABLE IF NOT EXISTS campaign_specialties (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          campaign_id BIGINT UNSIGNED NOT NULL,
          specialty_code VARCHAR(20) NOT NULL,
          specialty_name VARCHAR(100) NOT NULL,
          medico_id BIGINT UNSIGNED DEFAULT NULL,
          consultorio VARCHAR(100) DEFAULT NULL,
          cupo_maximo INT NOT NULL DEFAULT 30,
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_camp_spec (campaign_id, specialty_code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // 2. Asegurar columnas de especialidad en atenciones
        $colsStmt = $pdo->query("SHOW COLUMNS FROM atenciones");
        if ($colsStmt) {
            $cols = $colsStmt->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array('specialty_code', $cols)) {
                $pdo->exec("ALTER TABLE atenciones ADD COLUMN specialty_code VARCHAR(20) DEFAULT 'MED'");
            }
            if (!in_array('specialty_name', $cols)) {
                $pdo->exec("ALTER TABLE atenciones ADD COLUMN specialty_name VARCHAR(100) DEFAULT 'Medicina General'");
            }
            if (!in_array('ticket_codigo', $cols)) {
                $pdo->exec("ALTER TABLE atenciones ADD COLUMN ticket_codigo VARCHAR(30) DEFAULT NULL");
            }
            if (!in_array('medico_id', $cols)) {
                $pdo->exec("ALTER TABLE atenciones ADD COLUMN medico_id BIGINT UNSIGNED DEFAULT NULL");
            }
            if (!in_array('consultorio', $cols)) {
                $pdo->exec("ALTER TABLE atenciones ADD COLUMN consultorio VARCHAR(100) DEFAULT NULL");
            }
        }

        // 2.1 Asegurar que campos no obligatorios en beneficiarios permitan NULL y DNI no sea restrictivo
        try {
            $pdo->exec("ALTER TABLE beneficiarios MODIFY COLUMN dni VARCHAR(15) NULL DEFAULT NULL");
            $pdo->exec("ALTER TABLE beneficiarios MODIFY COLUMN fecha_nacimiento DATE NULL DEFAULT NULL");
            $pdo->exec("ALTER TABLE beneficiarios MODIFY COLUMN sexo ENUM('M','F','O') NULL DEFAULT 'O'");
            try { $pdo->exec("ALTER TABLE beneficiarios DROP INDEX beneficiarios_dni_unique"); } catch (\Throwable $e) {}
            try { $pdo->exec("ALTER TABLE beneficiarios ADD KEY idx_beneficiarios_dni (dni)"); } catch (\Throwable $e) {}
            try { $pdo->exec("ALTER TABLE beneficiarios ADD KEY idx_beneficiarios_apellidos (apellidos)"); } catch (\Throwable $e) {}
        } catch (\Throwable $e) {
            // Ignorar si ya está modificado o el usuario no tiene permisos de alter
        }

        // 3. Asegurar al menos una campaña activa
        $campCount = (int)$pdo->query("SELECT COUNT(*) FROM campaigns")->fetchColumn();
        if ($campCount === 0) {
            $pdo->exec("INSERT INTO campaigns (id, code, name, location_name, province, department, altitude_masl, start_date, status, created_at, updated_at) VALUES (1, 'CMP-2025-CUS-02', 'Cusco - Valle Sagrado 2025', 'Salon Comunal Rumichaca', 'Urubamba', 'Cusco', 2870, CURDATE(), 'active', NOW(), NOW())");
        }

        // 4. Asegurar especialidades por defecto para campaña 1 si está vacía
        $specCount = (int)$pdo->query("SELECT COUNT(*) FROM campaign_specialties WHERE campaign_id = 1")->fetchColumn();
        if ($specCount === 0) {
            $medico = $pdo->query("SELECT id FROM users WHERE role = 'medico' LIMIT 1")->fetch();
            $medicoId = $medico ? $medico['id'] : 'NULL';
            $pdo->exec("INSERT INTO campaign_specialties (campaign_id, specialty_code, specialty_name, medico_id, consultorio, cupo_maximo, active) VALUES
                (1, 'MED', 'Medicina General', $medicoId, 'Consultorio 01', 30, 1),
                (1, 'PED', 'Pediatría', $medicoId, 'Consultorio 02', 20, 1),
                (1, 'ODO', 'Odontología', NULL, 'Box Dental', 15, 1),
                (1, 'GIN', 'Ginecología', NULL, 'Tópico Ginec.', 15, 1),
                (1, 'OFT', 'Oftalmología', NULL, 'Módulo Visual', 20, 1)
            ");
        }

        // 5. Asegurar tabla system_settings y constantes maestras del sistema
        $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `key` VARCHAR(100) NOT NULL,
            `value` LONGTEXT DEFAULT NULL,
            `group` VARCHAR(50) NOT NULL DEFAULT 'general',
            `description` VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY system_settings_key_unique (`key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // Inicializar registro_fields con seccionAntecedentes = false si no existe
        $check = $pdo->prepare("SELECT COUNT(*) FROM system_settings WHERE `key` = :k");
        $check->execute([':k' => 'registro_fields']);
        if ($check->fetchColumn() == 0) {
            $defaultFields = json_encode([
                'estadoCivil' => true,
                'lenguaMaterna' => true,
                'seccionResidencia' => true,
                'comunidad' => true,
                'telefono' => true,
                'altitud' => true,
                'tiempoViaje' => true,
                'seguro' => true,
                'seccionAntecedentes' => false,
                'hipertension' => true,
                'diabetes' => true,
                'asma' => true,
                'anemia' => true,
                'gestante' => true,
                'alergias' => true,
            ], JSON_UNESCAPED_UNICODE);
            $ins = $pdo->prepare("INSERT INTO system_settings (`key`, `value`, `group`, `description`, created_at, updated_at) VALUES ('registro_fields', :v, 'features', 'Configuracion de campos de registro de beneficiarios', NOW(), NOW())");
            $ins->execute([':v' => $defaultFields]);
        }

        // 6. Asegurar tabla de dispensaciones de farmacia
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
    } catch (\Throwable $e) {
        // En caso de que el usuario de BD no tenga permisos ALTER, continuar sin interrumpir el flujo
    }
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
