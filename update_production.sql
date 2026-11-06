-- ============================================================================
-- SCRIPT DE ACTUALIZACIÓN DE BASE DE DATOS PARA PRODUCCIÓN (TRIAJE SEMILLA)
-- Versión compatible: MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- Módulos: Clasificación y Uso de Medicamentos, Farmacia y Multi-Especialidad
-- ============================================================================

-- 1. Tabla de Constantes y Configuración Dinámica del Sistema
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL,
  `value` LONGTEXT DEFAULT NULL,
  `group` VARCHAR(50) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `system_settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Asegurar nuevas columnas en la tabla `medicamentos`
-- Nota: En MySQL si la columna ya existe, omite el error o ejecute individualmente
SET @dbname = DATABASE();

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'medicamentos' AND COLUMN_NAME = 'campaign_id');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `medicamentos` ADD COLUMN `campaign_id` BIGINT UNSIGNED NULL AFTER `id`, ADD INDEX `idx_med_campaign` (`campaign_id`)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'medicamentos' AND COLUMN_NAME = 'codigo');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `medicamentos` ADD COLUMN `codigo` VARCHAR(60) NULL AFTER `campaign_id`, ADD INDEX `idx_med_codigo` (`codigo`)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'medicamentos' AND COLUMN_NAME = 'clasificacion');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `medicamentos` ADD COLUMN `clasificacion` VARCHAR(100) NULL AFTER `codigo`, ADD INDEX `idx_med_clasif` (`clasificacion`)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'medicamentos' AND COLUMN_NAME = 'uso');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `medicamentos` ADD COLUMN `uso` VARCHAR(60) NULL AFTER `activo`, ADD INDEX `idx_med_uso` (`uso`)', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'medicamentos' AND COLUMN_NAME = 'origen');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `medicamentos` ADD COLUMN `origen` VARCHAR(20) NOT NULL DEFAULT \'manual\'', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'medicamentos' AND COLUMN_NAME = 'stock_updated_at');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `medicamentos` ADD COLUMN `stock_updated_at` TIMESTAMP NULL DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Vincular medicamentos sin campaña a la campaña activa
UPDATE `medicamentos`
SET `campaign_id` = (SELECT id FROM `campaigns` ORDER BY (`status` = 'active') DESC, id DESC LIMIT 1)
WHERE `campaign_id` IS NULL;

-- 3. Tabla de Configuración de Vademécum y Sincronización Externa
CREATE TABLE IF NOT EXISTS `medicamentos_config` (
  `clave` VARCHAR(60) NOT NULL PRIMARY KEY,
  `valor` TEXT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Dispensaciones de Farmacia (Cargos, Firma Digital y Evidencias)
CREATE TABLE IF NOT EXISTS `medicamento_dispensaciones` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `atencion_id` BIGINT UNSIGNED DEFAULT NULL,
  `beneficiario_id` BIGINT UNSIGNED DEFAULT NULL,
  `paciente_nombre` VARCHAR(255) NOT NULL,
  `paciente_dni` VARCHAR(20) DEFAULT NULL,
  `medico_id` BIGINT UNSIGNED DEFAULT NULL,
  `medico_nombre` VARCHAR(200) NOT NULL,
  `items` JSON NOT NULL,
  `modalidad_cargo` ENUM('firma', 'foto', 'ambos', 'ninguno') NOT NULL DEFAULT 'firma',
  `firma_base64` LONGTEXT DEFAULT NULL,
  `foto_url` LONGTEXT DEFAULT NULL,
  `impreso` TINYINT(1) NOT NULL DEFAULT 0,
  `observaciones` TEXT DEFAULT NULL,
  `dispensado_por` BIGINT UNSIGNED DEFAULT NULL,
  `dispensado_por_nombre` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_disp_camp` (`campaign_id`),
  KEY `idx_disp_atencion` (`atencion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Especialidades por Campaña (Multi-especialidad)
CREATE TABLE IF NOT EXISTS `campaign_specialties` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `specialty_code` VARCHAR(20) NOT NULL,
  `specialty_name` VARCHAR(100) NOT NULL,
  `medico_id` BIGINT UNSIGNED DEFAULT NULL,
  `consultorio` VARCHAR(100) DEFAULT NULL,
  `cupo_maximo` INT NOT NULL DEFAULT 30,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_camp_spec` (`campaign_id`, `specialty_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Asegurar columnas de Especialidad en la tabla `atenciones`
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'atenciones' AND COLUMN_NAME = 'specialty_code');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `atenciones` ADD COLUMN `specialty_code` VARCHAR(20) DEFAULT \'MED\'', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'atenciones' AND COLUMN_NAME = 'specialty_name');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `atenciones` ADD COLUMN `specialty_name` VARCHAR(100) DEFAULT \'Medicina General\'', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'atenciones' AND COLUMN_NAME = 'ticket_codigo');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `atenciones` ADD COLUMN `ticket_codigo` VARCHAR(30) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'atenciones' AND COLUMN_NAME = 'medico_id');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `atenciones` ADD COLUMN `medico_id` BIGINT UNSIGNED DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'atenciones' AND COLUMN_NAME = 'consultorio');
SET @s = IF(@col_exists = 0, 'ALTER TABLE `atenciones` ADD COLUMN `consultorio` VARCHAR(100) DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

