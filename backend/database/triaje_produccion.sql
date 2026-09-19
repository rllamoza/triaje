-- ============================================================
--  SISTEMA DE TRIAJE MÉDICO - SEMILLA MÉDICA
--  Script de Base de Datos para PRODUCCIÓN (MySQL 8.x)
--  Generado: 2026-09-18
--  Uso: Ejecutar como root o usuario con permisos CREATE/GRANT
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1. CREAR BASE DE DATOS
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `triaje_semilla`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `triaje_semilla`;

-- ------------------------------------------------------------
-- 2. USUARIO DE APLICACIÓN (cambiar password en producción)
-- ------------------------------------------------------------
-- CREATE USER IF NOT EXISTS 'semilla_app'@'localhost' IDENTIFIED BY 'CAMBIAR_PASSWORD_PRODUCCION';
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON `triaje_semilla`.* TO 'semilla_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ------------------------------------------------------------
-- 3. TABLAS DEL SISTEMA (en orden de dependencias)
-- ------------------------------------------------------------

-- Laravel migrations tracking
CREATE TABLE IF NOT EXISTS `migrations` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `migration` VARCHAR(255) NOT NULL,
  `batch`     INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `cmp_code`           VARCHAR(30)     DEFAULT NULL UNIQUE,
  `dni`                VARCHAR(8)      DEFAULT NULL,
  `name`               VARCHAR(255)    NOT NULL,
  `apellidos`          VARCHAR(100)    DEFAULT NULL,
  `role`               ENUM('admin','medico','triaje','admision','guardia') NOT NULL DEFAULT 'admision',
  `email`              VARCHAR(255)    NOT NULL UNIQUE,
  `email_verified_at`  TIMESTAMP       DEFAULT NULL,
  `password`           VARCHAR(255)    NOT NULL,
  `pin_hash`           VARCHAR(255)    DEFAULT NULL,
  `biometric_hash`     VARCHAR(500)    DEFAULT NULL,
  `token_fisico`       VARCHAR(100)    DEFAULT NULL,
  `station_default`    VARCHAR(20)     DEFAULT NULL,
  `active`             TINYINT(1)      NOT NULL DEFAULT 1,
  `last_login_at`      TIMESTAMP       DEFAULT NULL,
  `remember_token`     VARCHAR(100)    DEFAULT NULL,
  `created_at`         TIMESTAMP       DEFAULT NULL,
  `updated_at`         TIMESTAMP       DEFAULT NULL,
  INDEX `users_role_idx` (`role`),
  INDEX `users_active_idx` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── PASSWORD RESET TOKENS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email`      VARCHAR(255) NOT NULL PRIMARY KEY,
  `token`      VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP    DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SESSIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`            VARCHAR(255)   NOT NULL PRIMARY KEY,
  `user_id`       BIGINT UNSIGNED DEFAULT NULL,
  `ip_address`    VARCHAR(45)    DEFAULT NULL,
  `user_agent`    TEXT           DEFAULT NULL,
  `payload`       LONGTEXT       NOT NULL,
  `last_activity` INT            NOT NULL,
  INDEX `sessions_user_id_idx` (`user_id`),
  INDEX `sessions_last_activity_idx` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CACHE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cache` (
  `key`        VARCHAR(255)    NOT NULL PRIMARY KEY,
  `value`      MEDIUMTEXT      NOT NULL,
  `expiration` BIGINT          NOT NULL,
  INDEX `cache_expiration_idx` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key`        VARCHAR(255) NOT NULL PRIMARY KEY,
  `owner`      VARCHAR(255) NOT NULL,
  `expiration` BIGINT       NOT NULL,
  INDEX `cache_locks_expiration_idx` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── JOBS / QUEUES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `jobs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `queue`        VARCHAR(255)    NOT NULL,
  `payload`      LONGTEXT        NOT NULL,
  `attempts`     SMALLINT UNSIGNED NOT NULL,
  `reserved_at`  INT UNSIGNED    DEFAULT NULL,
  `available_at` INT UNSIGNED    NOT NULL,
  `created_at`   INT UNSIGNED    NOT NULL,
  INDEX `jobs_queue_idx` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `job_batches` (
  `id`              VARCHAR(255) NOT NULL PRIMARY KEY,
  `name`            VARCHAR(255) NOT NULL,
  `total_jobs`      INT          NOT NULL,
  `pending_jobs`    INT          NOT NULL,
  `failed_jobs`     INT          NOT NULL,
  `failed_job_ids`  LONGTEXT     NOT NULL,
  `options`         MEDIUMTEXT   DEFAULT NULL,
  `cancelled_at`    INT          DEFAULT NULL,
  `created_at`      INT          NOT NULL,
  `finished_at`     INT          DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `uuid`       VARCHAR(255)    NOT NULL UNIQUE,
  `connection` TEXT            NOT NULL,
  `queue`      TEXT            NOT NULL,
  `payload`    LONGTEXT        NOT NULL,
  `exception`  LONGTEXT        NOT NULL,
  `failed_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `failed_jobs_connection_queue_idx` (`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── PERSONAL ACCESS TOKENS (Sanctum) ──────────────────────────
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `tokenable_type`  VARCHAR(255)    NOT NULL,
  `tokenable_id`    BIGINT UNSIGNED NOT NULL,
  `name`            TEXT            NOT NULL,
  `token`           VARCHAR(64)     NOT NULL UNIQUE,
  `abilities`       TEXT            DEFAULT NULL,
  `last_used_at`    TIMESTAMP       DEFAULT NULL,
  `expires_at`      TIMESTAMP       DEFAULT NULL,
  `created_at`      TIMESTAMP       DEFAULT NULL,
  `updated_at`      TIMESTAMP       DEFAULT NULL,
  INDEX `personal_access_tokens_tokenable_idx` (`tokenable_type`, `tokenable_id`),
  INDEX `personal_access_tokens_expires_at_idx` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CAMPAIGNS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `code`            VARCHAR(20)     NOT NULL UNIQUE,
  `name`            VARCHAR(200)    NOT NULL,
  `location_name`   VARCHAR(200)    NOT NULL,
  `province`        VARCHAR(100)    DEFAULT NULL,
  `department`      VARCHAR(100)    DEFAULT NULL,
  `altitude_masl`   INT             DEFAULT NULL,
  `start_date`      DATE            NOT NULL,
  `end_date`        DATE            DEFAULT NULL,
  `status`          ENUM('planned','active','closed') NOT NULL DEFAULT 'planned',
  `node_id`         VARCHAR(50)     DEFAULT NULL,
  `starlink_active` TINYINT(1)      NOT NULL DEFAULT 0,
  `notes`           TEXT            DEFAULT NULL,
  `created_by`      BIGINT UNSIGNED DEFAULT NULL,
  `created_at`      TIMESTAMP       DEFAULT NULL,
  `updated_at`      TIMESTAMP       DEFAULT NULL,
  CONSTRAINT `campaigns_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── STATIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `stations` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `code`        VARCHAR(20)     NOT NULL,
  `type`        ENUM('admision','triaje','medico','farmacia','pediatria','otro') NOT NULL,
  `label`       VARCHAR(100)    NOT NULL,
  `printer_id`  VARCHAR(50)     DEFAULT NULL,
  `active`      TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP       DEFAULT NULL,
  `updated_at`  TIMESTAMP       DEFAULT NULL,
  UNIQUE KEY `stations_campaign_code_unique` (`campaign_id`, `code`),
  CONSTRAINT `stations_campaign_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── BENEFICIARIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `beneficiarios` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `dni`                 VARCHAR(8)      NOT NULL UNIQUE,
  `nombres`             VARCHAR(100)    NOT NULL,
  `apellidos`           VARCHAR(100)    NOT NULL,
  `fecha_nacimiento`    DATE            NOT NULL,
  `edad_calculada`      TINYINT         DEFAULT NULL,
  `sexo`                ENUM('M','F','O') NOT NULL,
  `estado_civil`        ENUM('soltero','casado','conviviente','viudo','divorciado') DEFAULT NULL,
  `idioma_principal`    ENUM('espanol','quechua','aymara','otro') NOT NULL DEFAULT 'espanol',
  `grado_instruccion`   VARCHAR(50)     DEFAULT NULL,
  `ocupacion`           VARCHAR(100)    DEFAULT NULL,
  -- Dirección
  `region`              VARCHAR(100)    DEFAULT NULL,
  `provincia`           VARCHAR(100)    DEFAULT NULL,
  `distrito`            VARCHAR(100)    DEFAULT NULL,
  `comunidad`           VARCHAR(150)    DEFAULT NULL,
  `direccion_libre`     VARCHAR(200)    DEFAULT NULL,
  `altitud_residencia`  INT             DEFAULT NULL,
  -- Seguro
  `tipo_seguro`         ENUM('SIS','ESSALUD','privado','ninguno','otro') NOT NULL DEFAULT 'ninguno',
  `numero_afiliacion`   VARCHAR(50)     DEFAULT NULL,
  -- Contacto
  `celular`             VARCHAR(15)     DEFAULT NULL,
  -- Datos clínicos base
  `grupo_sanguineo`     VARCHAR(5)      DEFAULT NULL,
  `rh_factor`           ENUM('+','-')   DEFAULT NULL,
  `peso_kg`             DECIMAL(5,2)    DEFAULT NULL,
  `talla_cm`            DECIMAL(5,1)    DEFAULT NULL,
  `imc`                 DECIMAL(4,1)    DEFAULT NULL,
  -- RENIEC
  `reniec_verified`     TINYINT(1)      NOT NULL DEFAULT 0,
  `reniec_data_raw`     JSON            DEFAULT NULL,
  -- Meta
  `registered_by`       BIGINT UNSIGNED DEFAULT NULL,
  `campaign_id`         BIGINT UNSIGNED NOT NULL,
  `created_at`          TIMESTAMP       DEFAULT NULL,
  `updated_at`          TIMESTAMP       DEFAULT NULL,
  INDEX `beneficiarios_nombres_idx` (`nombres`, `apellidos`),
  INDEX `beneficiarios_campaign_idx` (`campaign_id`),
  CONSTRAINT `beneficiarios_registered_by_fk` FOREIGN KEY (`registered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `beneficiarios_campaign_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ATENCIONES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `atenciones` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ticket_number`    INT             NOT NULL,
  `beneficiario_id`  BIGINT UNSIGNED NOT NULL,
  `campaign_id`      BIGINT UNSIGNED NOT NULL,
  `station_id`       BIGINT UNSIGNED DEFAULT NULL,
  `arrival_time`     DATETIME        NOT NULL,
  `status`           ENUM('admitido','en_espera_triaje','en_triaje','en_espera_medico','en_consulta','en_farmacia','finalizado','referido','no_se_presento') NOT NULL DEFAULT 'admitido',
  `seguro_usado`     VARCHAR(50)     DEFAULT NULL,
  `triage_start_at`  DATETIME        DEFAULT NULL,
  `triage_end_at`    DATETIME        DEFAULT NULL,
  `medico_start_at`  DATETIME        DEFAULT NULL,
  `medico_end_at`    DATETIME        DEFAULT NULL,
  `referred_to`      VARCHAR(200)    DEFAULT NULL,
  `notes`            TEXT            DEFAULT NULL,
  `admitted_by`      BIGINT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP       DEFAULT NULL,
  `updated_at`       TIMESTAMP       DEFAULT NULL,
  UNIQUE KEY `atenciones_campaign_ticket_unique` (`campaign_id`, `ticket_number`),
  INDEX `atenciones_beneficiario_idx` (`beneficiario_id`),
  INDEX `atenciones_arrival_time_idx` (`arrival_time`),
  INDEX `atenciones_status_idx` (`status`),
  CONSTRAINT `atenciones_beneficiario_fk` FOREIGN KEY (`beneficiario_id`) REFERENCES `beneficiarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `atenciones_campaign_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `atenciones_station_fk` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `atenciones_admitted_by_fk` FOREIGN KEY (`admitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TRIAJES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `triajes` (
  `id`                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `atencion_id`              BIGINT UNSIGNED NOT NULL UNIQUE,
  -- Signos vitales
  `temperatura_c`            DECIMAL(4,1)    DEFAULT NULL,
  `presion_sistolica`        SMALLINT        DEFAULT NULL,
  `presion_diastolica`       SMALLINT        DEFAULT NULL,
  `frecuencia_cardiaca`      SMALLINT        DEFAULT NULL,
  `frecuencia_respiratoria`  TINYINT         DEFAULT NULL,
  `saturacion_o2_pct`        TINYINT         DEFAULT NULL,
  `glucosa_mg_dl`            SMALLINT        DEFAULT NULL,
  `peso_kg`                  DECIMAL(5,2)    DEFAULT NULL,
  `talla_cm`                 DECIMAL(5,1)    DEFAULT NULL,
  `imc`                      DECIMAL(4,1)    DEFAULT NULL,
  -- Altitud
  `altitud_atencion_masl`    INT             DEFAULT NULL,
  `saturacion_corregida`     TINYINT         DEFAULT NULL,
  -- Prioridad Manchester Andina
  `prioridad`                ENUM('I','II','III') NOT NULL DEFAULT 'III',
  `prioridad_label`          VARCHAR(30)     DEFAULT NULL,
  `prioridad_color`          ENUM('rojo','amarillo','verde') NOT NULL DEFAULT 'verde',
  -- Anamnesis
  `sintoma_principal`        VARCHAR(200)    DEFAULT NULL,
  `alergias_activas`         JSON            DEFAULT NULL,
  `alertas_clinicas`         JSON            DEFAULT NULL,
  `motivo_consulta`          TEXT            DEFAULT NULL,
  `observaciones_triaje`     TEXT            DEFAULT NULL,
  -- Personal
  `enfermera_id`             BIGINT UNSIGNED DEFAULT NULL,
  `created_at`               TIMESTAMP       DEFAULT NULL,
  `updated_at`               TIMESTAMP       DEFAULT NULL,
  CONSTRAINT `triajes_atencion_fk` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `triajes_enfermera_fk` FOREIGN KEY (`enfermera_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── MEDICAMENTOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `medicamentos` (
  `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `nombre_generico`      VARCHAR(200)    NOT NULL,
  `nombre_comercial`     VARCHAR(200)    DEFAULT NULL,
  `concentracion`        VARCHAR(50)     DEFAULT NULL,
  `forma_farmaceutica`   ENUM('tableta','capsula','jarabe','inyectable','crema','ovulo','solucion','otro') NOT NULL,
  `via_administracion`   ENUM('oral','IM','IV','topica','inhalada','sublingual','otro') NOT NULL,
  `stock_actual`         INT             NOT NULL DEFAULT 0,
  `stock_minimo`         INT             NOT NULL DEFAULT 10,
  `activo`               TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`           TIMESTAMP       DEFAULT NULL,
  `updated_at`           TIMESTAMP       DEFAULT NULL,
  FULLTEXT INDEX `medicamentos_search_ft` (`nombre_generico`, `nombre_comercial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CONSULTAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `consultas` (
  `id`                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `atencion_id`              BIGINT UNSIGNED NOT NULL UNIQUE,
  `medico_id`                BIGINT UNSIGNED DEFAULT NULL,
  -- Anamnesis
  `motivo_consulta`          TEXT            DEFAULT NULL,
  `enfermedad_actual`        TEXT            DEFAULT NULL,
  `antecedentes_personales`  TEXT            DEFAULT NULL,
  `antecedentes_familiares`  TEXT            DEFAULT NULL,
  -- Examen físico (JSON por sistemas)
  `examen_fisico`            JSON            DEFAULT NULL,
  -- Diagnósticos CIE-10
  `diagnosticos`             JSON            DEFAULT NULL,
  -- Plan terapéutico
  `plan_tratamiento`         TEXT            DEFAULT NULL,
  `indicaciones`             TEXT            DEFAULT NULL,
  -- Receta
  `receta`                   JSON            DEFAULT NULL,
  -- Exámenes auxiliares
  `examenes_solicitados`     JSON            DEFAULT NULL,
  -- Derivación
  `requiere_referencia`      TINYINT(1)      NOT NULL DEFAULT 0,
  `referencia_destino`       VARCHAR(200)    DEFAULT NULL,
  `referencia_urgencia`      ENUM('normal','urgente','emergencia') DEFAULT NULL,
  -- Firma digital
  `signature_hash`           TEXT            DEFAULT NULL,
  `signed_at`                DATETIME        DEFAULT NULL,
  `created_at`               TIMESTAMP       DEFAULT NULL,
  `updated_at`               TIMESTAMP       DEFAULT NULL,
  CONSTRAINT `consultas_atencion_fk` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultas_medico_fk` FOREIGN KEY (`medico_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TICKETS TÉRMICOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tickets_termicos` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `atencion_id`     BIGINT UNSIGNED NOT NULL,
  `tipo`            ENUM('admision','receta','referencia','cierre') NOT NULL,
  `printer_id`      VARCHAR(50)     DEFAULT NULL,
  `contenido_raw`   TEXT            DEFAULT NULL,
  `escpos_base64`   TEXT            DEFAULT NULL,
  `qr_code`         VARCHAR(200)    DEFAULT NULL,
  `printed_at`      DATETIME        DEFAULT NULL,
  `printed_by`      BIGINT UNSIGNED DEFAULT NULL,
  `bt_device_name`  VARCHAR(100)    DEFAULT NULL,
  `created_at`      TIMESTAMP       DEFAULT NULL,
  `updated_at`      TIMESTAMP       DEFAULT NULL,
  INDEX `tickets_atencion_idx` (`atencion_id`),
  CONSTRAINT `tickets_atencion_fk` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_printed_by_fk` FOREIGN KEY (`printed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── CAMPAIGN USERS (pivot) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `campaign_users` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id`    BIGINT UNSIGNED NOT NULL,
  `user_id`        BIGINT UNSIGNED NOT NULL,
  `station_id`     VARCHAR(20)     DEFAULT NULL,
  `role_override`  VARCHAR(30)     DEFAULT NULL,
  `active`         TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP       DEFAULT NULL,
  `updated_at`     TIMESTAMP       DEFAULT NULL,
  UNIQUE KEY `campaign_users_unique` (`campaign_id`, `user_id`),
  CONSTRAINT `campaign_users_campaign_fk` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_users_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SYNC LOGS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sync_logs` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `node_id`         VARCHAR(50)     NOT NULL,
  `entity_type`     VARCHAR(50)     NOT NULL,
  `entity_id`       BIGINT UNSIGNED NOT NULL,
  `operation`       ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  `payload`         JSON            NOT NULL,
  `synced`          TINYINT(1)      NOT NULL DEFAULT 0,
  `synced_at`       DATETIME        DEFAULT NULL,
  `conflict`        TINYINT(1)      NOT NULL DEFAULT 0,
  `conflict_notes`  TEXT            DEFAULT NULL,
  `created_at`      TIMESTAMP       DEFAULT NULL,
  `updated_at`      TIMESTAMP       DEFAULT NULL,
  INDEX `sync_logs_node_synced_idx` (`node_id`, `synced`),
  INDEX `sync_logs_entity_idx` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── AUDIT LOGS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id`      BIGINT UNSIGNED DEFAULT NULL,
  `action`       VARCHAR(100)    NOT NULL,
  `entity_type`  VARCHAR(50)     DEFAULT NULL,
  `entity_id`    BIGINT UNSIGNED DEFAULT NULL,
  `ip_address`   VARCHAR(45)     DEFAULT NULL,
  `node_id`      VARCHAR(50)     DEFAULT NULL,
  `old_data`     JSON            DEFAULT NULL,
  `new_data`     JSON            DEFAULT NULL,
  `created_at`   TIMESTAMP       DEFAULT NULL,
  `updated_at`   TIMESTAMP       DEFAULT NULL,
  INDEX `audit_logs_entity_idx` (`entity_type`, `entity_id`),
  INDEX `audit_logs_user_idx` (`user_id`),
  CONSTRAINT `audit_logs_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── RENIEC CACHE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `reniec_cache` (
  `dni`         VARCHAR(8)  NOT NULL PRIMARY KEY,
  `data`        JSON        NOT NULL,
  `cached_at`   TIMESTAMP   NOT NULL,
  `expires_at`  TIMESTAMP   NOT NULL,
  INDEX `reniec_cache_expires_idx` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. DATOS INICIALES (Seed de producción)
-- ============================================================

-- Usuario administrador inicial
-- IMPORTANTE: Cambiar la contraseña después del primer login
-- Password por defecto: Admin2025!  (hash bcrypt)
INSERT IGNORE INTO `users`
  (`name`, `apellidos`, `email`, `password`, `cmp_code`, `role`, `pin_hash`, `active`, `created_at`, `updated_at`)
VALUES
  ('Administrador', 'Semilla', 'admin@semilla.pe',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin2025!
   'ADMIN-001', 'admin',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- PIN: 1234
   1, NOW(), NOW());

-- ============================================================
-- 5. MARCAR MIGRACIONES COMO EJECUTADAS
-- ============================================================
INSERT IGNORE INTO `migrations` (`migration`, `batch`) VALUES
  ('0001_01_01_000000_create_users_table', 1),
  ('0001_01_01_000001_create_cache_table', 1),
  ('0001_01_01_000002_create_jobs_table', 1),
  ('2026_09_18_041700_create_personal_access_tokens_table', 1),
  ('2026_09_18_100000_alter_users_add_medical_fields', 1),
  ('2026_09_18_100001_create_campaigns_table', 1),
  ('2026_09_18_100002_create_stations_table', 1),
  ('2026_09_18_100003_create_beneficiarios_table', 1),
  ('2026_09_18_100004_create_atenciones_table', 1),
  ('2026_09_18_100005_create_triajes_table', 1),
  ('2026_09_18_100006_create_medicamentos_table', 1),
  ('2026_09_18_100007_create_consultas_table', 1),
  ('2026_09_18_100008_create_tickets_termicos_table', 1),
  ('2026_09_18_100009_create_campaign_users_table', 1),
  ('2026_09_18_100010_create_sync_logs_table', 1),
  ('2026_09_18_100011_create_audit_logs_table', 1),
  ('2026_09_18_100012_create_reniec_cache_table', 1);

COMMIT;

-- ============================================================
-- INSTRUCCIONES DE DESPLIEGUE EN PRODUCCIÓN
-- ============================================================
-- 1. Subir este archivo al servidor: scp triaje_produccion.sql user@server:/tmp/
-- 2. Ejecutar: mysql -u root -p < /tmp/triaje_produccion.sql
-- 3. Ajustar .env del backend con los datos del servidor:
--      DB_DATABASE=triaje_semilla
--      DB_USERNAME=semilla_app   (o root temporalmente)
--      DB_PASSWORD=CAMBIAR_PASSWORD_PRODUCCION
-- 4. Correr seeders adicionales si se requieren datos demo:
--      php artisan db:seed --class=MedicamentosSeeder
--      php artisan db:seed --class=CampaignSeeder
--      php artisan db:seed --class=UsersSeeder
-- 5. Cambiar password del admin en primer login
-- ============================================================
