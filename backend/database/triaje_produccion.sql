-- ============================================================
-- SEMILLA TRIAJE - DUMP SQL COMPLETO PARA PRODUCCIÓN (cPanel)
-- Base de datos: triaje_semilla
-- Generado: 2026-10-12 23:44:36
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Estructura para tabla: `atenciones`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `atenciones`;
CREATE TABLE `atenciones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ticket_number` int NOT NULL,
  `beneficiario_id` bigint unsigned NOT NULL,
  `campaign_id` bigint unsigned NOT NULL,
  `station_id` bigint unsigned DEFAULT NULL,
  `arrival_time` datetime NOT NULL,
  `status` enum('admitido','en_espera_triaje','en_triaje','en_espera_medico','en_consulta','en_farmacia','finalizado','referido','no_se_presento') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admitido',
  `seguro_usado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `triage_start_at` datetime DEFAULT NULL,
  `triage_end_at` datetime DEFAULT NULL,
  `medico_start_at` datetime DEFAULT NULL,
  `medico_end_at` datetime DEFAULT NULL,
  `referred_to` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `admitted_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `atenciones_campaign_id_ticket_number_unique` (`campaign_id`,`ticket_number`),
  KEY `atenciones_beneficiario_id_foreign` (`beneficiario_id`),
  KEY `atenciones_station_id_foreign` (`station_id`),
  KEY `atenciones_admitted_by_foreign` (`admitted_by`),
  CONSTRAINT `atenciones_admitted_by_foreign` FOREIGN KEY (`admitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `atenciones_beneficiario_id_foreign` FOREIGN KEY (`beneficiario_id`) REFERENCES `beneficiarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `atenciones_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `atenciones_station_id_foreign` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `audit_logs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `node_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_entity_type_entity_id_index` (`entity_type`,`entity_id`),
  KEY `audit_logs_user_id_index` (`user_id`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `beneficiarios`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `beneficiarios`;
CREATE TABLE `beneficiarios` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `dni` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `edad_calculada` tinyint DEFAULT NULL,
  `sexo` enum('M','F','O') COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_civil` enum('soltero','casado','conviviente','viudo','divorciado') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idioma_principal` enum('espanol','quechua','aymara','otro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'espanol',
  `grado_instruccion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ocupacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provincia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distrito` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comunidad` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion_libre` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `altitud_residencia` int DEFAULT NULL,
  `tipo_seguro` enum('SIS','ESSALUD','privado','ninguno','otro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ninguno',
  `numero_afiliacion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grupo_sanguineo` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rh_factor` enum('+','-') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `peso_kg` decimal(5,2) DEFAULT NULL,
  `talla_cm` decimal(5,1) DEFAULT NULL,
  `reniec_verified` tinyint(1) NOT NULL DEFAULT '0',
  `reniec_data_raw` json DEFAULT NULL,
  `registered_by` bigint unsigned DEFAULT NULL,
  `campaign_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `beneficiarios_dni_unique` (`dni`),
  KEY `beneficiarios_registered_by_foreign` (`registered_by`),
  KEY `beneficiarios_campaign_id_foreign` (`campaign_id`),
  CONSTRAINT `beneficiarios_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `beneficiarios_registered_by_foreign` FOREIGN KEY (`registered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `cache`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `cache_locks`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `campaign_users`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `campaign_users`;
CREATE TABLE `campaign_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `station_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_override` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `campaign_users_campaign_id_user_id_unique` (`campaign_id`,`user_id`),
  KEY `campaign_users_user_id_foreign` (`user_id`),
  CONSTRAINT `campaign_users_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_users_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `campaigns`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `campaigns`;
CREATE TABLE `campaigns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `altitude_masl` int DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('planned','active','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planned',
  `node_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `starlink_active` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `campaigns_code_unique` (`code`),
  KEY `campaigns_created_by_foreign` (`created_by`),
  CONSTRAINT `campaigns_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para tabla: `campaigns`
INSERT INTO `campaigns` (`id`, `code`, `name`, `location_name`, `province`, `department`, `altitude_masl`, `start_date`, `end_date`, `status`, `node_id`, `starlink_active`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES ('1', 'CMP-2025-CUS-02', 'Cusco - Valle Sagrado 2025', 'Salon Comunal Rumichaca', 'Urubamba', 'Cusco', '2870', '2025-04-01', NULL, 'active', 'CUS-VALLE-04', '1', NULL, NULL, '2026-10-12 19:41:02', '2026-10-12 19:41:02');

-- ------------------------------------------------------------
-- Estructura para tabla: `consultas`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `consultas`;
CREATE TABLE `consultas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `atencion_id` bigint unsigned NOT NULL,
  `medico_id` bigint unsigned DEFAULT NULL,
  `motivo_consulta` text COLLATE utf8mb4_unicode_ci,
  `enfermedad_actual` text COLLATE utf8mb4_unicode_ci,
  `antecedentes_personales` text COLLATE utf8mb4_unicode_ci,
  `antecedentes_familiares` text COLLATE utf8mb4_unicode_ci,
  `examen_fisico` json DEFAULT NULL,
  `diagnosticos` json DEFAULT NULL,
  `plan_tratamiento` text COLLATE utf8mb4_unicode_ci,
  `indicaciones` text COLLATE utf8mb4_unicode_ci,
  `receta` json DEFAULT NULL,
  `examenes_solicitados` json DEFAULT NULL,
  `requiere_referencia` tinyint(1) NOT NULL DEFAULT '0',
  `referencia_destino` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referencia_urgencia` enum('normal','urgente','emergencia') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signature_hash` text COLLATE utf8mb4_unicode_ci,
  `signed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `consultas_atencion_id_unique` (`atencion_id`),
  KEY `consultas_medico_id_foreign` (`medico_id`),
  CONSTRAINT `consultas_atencion_id_foreign` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultas_medico_id_foreign` FOREIGN KEY (`medico_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `failed_jobs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `job_batches`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `jobs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `medicamentos`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `medicamentos`;
CREATE TABLE `medicamentos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nombre_generico` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_comercial` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `concentracion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `forma_farmaceutica` enum('tableta','capsula','jarabe','inyectable','crema','ovulo','solucion','otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `via_administracion` enum('oral','IM','IV','topica','inhalada','sublingual','otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock_actual` int NOT NULL DEFAULT '0',
  `stock_minimo` int NOT NULL DEFAULT '10',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para tabla: `medicamentos`
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('1', 'Paracetamol', NULL, '500mg', 'tableta', 'oral', '500', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('2', 'Paracetamol', NULL, '1g', 'tableta', 'oral', '200', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('3', 'Ibuprofeno', NULL, '400mg', 'tableta', 'oral', '300', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('4', 'Amoxicilina', NULL, '500mg', 'capsula', 'oral', '200', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('5', 'Enalapril', NULL, '10mg', 'tableta', 'oral', '150', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('6', 'Metformina', NULL, '850mg', 'tableta', 'oral', '100', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('7', 'Amlodipino', NULL, '5mg', 'tableta', 'oral', '100', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('8', 'Omeprazol', NULL, '20mg', 'capsula', 'oral', '200', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('9', 'Loratadina', NULL, '10mg', 'tableta', 'oral', '150', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('10', 'Azitromicina', NULL, '500mg', 'tableta', 'oral', '80', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('11', 'Ciprofloxacino', NULL, '500mg', 'tableta', 'oral', '80', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('12', 'Diclofenaco', NULL, '50mg', 'tableta', 'oral', '120', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('13', 'Metronidazol', NULL, '500mg', 'tableta', 'oral', '100', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('14', 'Sulfato Ferroso', NULL, '200mg', 'tableta', 'oral', '200', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('15', 'Vitamina C', NULL, '500mg', 'tableta', 'oral', '300', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('16', 'Atorvastatina', NULL, '20mg', 'tableta', 'oral', '60', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('17', 'Salbutamol', NULL, '100mcg', 'otro', 'inhalada', '30', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('18', 'Suero Oral', NULL, 'Sachet', 'solucion', 'oral', '400', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('19', 'Dimenhidrinato', NULL, '50mg', 'tableta', 'oral', '100', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('20', 'Ketorolaco', NULL, '30mg/ml', 'inyectable', 'IM', '50', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('21', 'Dexametasona', NULL, '4mg/ml', 'inyectable', 'IM', '30', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('22', 'Furosemida', NULL, '40mg', 'tableta', 'oral', '40', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('23', 'Captopril', NULL, '25mg', 'tableta', 'oral', '80', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('24', 'Betametasona', NULL, '0.05%', 'crema', 'topica', '30', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `medicamentos` (`id`, `nombre_generico`, `nombre_comercial`, `concentracion`, `forma_farmaceutica`, `via_administracion`, `stock_actual`, `stock_minimo`, `activo`, `created_at`, `updated_at`) VALUES ('25', 'Diazepam', NULL, '5mg', 'tableta', 'oral', '20', '10', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');

-- ------------------------------------------------------------
-- Estructura para tabla: `migrations`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para tabla: `migrations`
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('1', '0001_01_01_000000_create_users_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('2', '0001_01_01_000001_create_cache_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('3', '0001_01_01_000002_create_jobs_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('4', '2026_09_18_041700_create_personal_access_tokens_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('5', '2026_09_18_041701_create_permission_tables', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('6', '2026_09_18_100000_alter_users_add_medical_fields', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('7', '2026_09_18_100001_create_campaigns_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('8', '2026_09_18_100002_create_stations_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('9', '2026_09_18_100003_create_beneficiarios_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('10', '2026_09_18_100004_create_atenciones_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('11', '2026_09_18_100005_create_triajes_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('12', '2026_09_18_100006_create_medicamentos_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('13', '2026_09_18_100007_create_consultas_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('14', '2026_09_18_100008_create_tickets_termicos_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('15', '2026_09_18_100009_create_campaign_users_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('16', '2026_09_18_100010_create_sync_logs_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('17', '2026_09_18_100011_create_audit_logs_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('18', '2026_09_18_100012_create_reniec_cache_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('19', '2026_09_22_100001_create_system_settings_table', '1');
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES ('20', '2026_09_22_100002_create_audit_records_on_audi_triaje', '1');

-- ------------------------------------------------------------
-- Estructura para tabla: `model_has_permissions`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `model_has_permissions`;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `model_has_roles`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `model_has_roles`;
CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `password_reset_tokens`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `permissions`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `personal_access_tokens`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para tabla: `personal_access_tokens`
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('1', 'App\\Models\\User', '1', 'semilla-session', '0d0d2882f7f7b077ac67714c730fd2e646808790a9c97ff8702a98f14ee2d1af', '[\"*\"]', '2026-10-12 19:47:25', '2026-10-13 03:46:16', '2026-10-12 19:46:17', '2026-10-12 19:47:25');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('2', 'App\\Models\\User', '1', 'semilla-session', 'e3d567a88b8a369f100bab1d8e216d40f190a515d24738ea71f41ae2faf730e6', '[\"*\"]', NULL, '2026-10-13 03:46:31', '2026-10-12 19:46:31', '2026-10-12 19:46:31');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('3', 'App\\Models\\User', '1', 'semilla-pin', 'b6bae382426511aa1f1ca7e3974abc655abdd289cfe1266833a9104ae378efda', '[\"*\"]', NULL, '2026-10-12 23:46:54', '2026-10-12 19:46:54', '2026-10-12 19:46:54');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('4', 'App\\Models\\User', '1', 'semilla-session', '3d3fa3c9b19fc015c212161b9be6463a114f16a9dfcd38e98c7d4d24e7799078', '[\"*\"]', '2026-10-12 19:51:03', '2026-10-13 03:51:03', '2026-10-12 19:51:03', '2026-10-12 19:51:03');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('5', 'App\\Models\\User', '1', 'semilla-session', 'cb5a501a1c358ed2bd1b7ec18cc8660ae94d04c45bd75bb2c3ca2e5327ba8e32', '[\"*\"]', '2026-10-12 19:51:21', '2026-10-13 03:51:20', '2026-10-12 19:51:20', '2026-10-12 19:51:21');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('7', 'App\\Models\\User', '1', 'semilla-session', '19a2ff682b696ad1cab76523d76a957c15b4e600b62bf2e9ec8abffd9bb239af', '[\"*\"]', '2026-10-12 22:40:54', '2026-10-13 03:57:12', '2026-10-12 19:57:12', '2026-10-12 22:40:54');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('8', 'App\\Models\\User', '1', 'semilla-session', 'c091ab4ffd6704a424753d5801fc872875bbdecd45649e5eabef782c24563b33', '[\"*\"]', '2026-10-12 20:05:47', '2026-10-13 04:05:47', '2026-10-12 20:05:47', '2026-10-12 20:05:47');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('9', 'App\\Models\\User', '1', 'semilla-session', '16993068c03ef5bc76d8a85b26bc6de6d1e0378edd6bc9fbc2df0afb3f8f368d', '[\"*\"]', '2026-10-12 20:06:04', '2026-10-13 04:06:04', '2026-10-12 20:06:04', '2026-10-12 20:06:04');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('10', 'App\\Models\\User', '1', 'semilla-session', '850bc4a9bd61da2b23834475296df26598fdeefc834966cef68c35f717de5fd6', '[\"*\"]', '2026-10-12 20:06:26', '2026-10-13 04:06:26', '2026-10-12 20:06:26', '2026-10-12 20:06:26');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('11', 'App\\Models\\User', '1', 'semilla-session', 'cfd8e869bde2044a76f7db7d60caa784e1d556dfd9e280d7caf361f016ed119a', '[\"*\"]', '2026-10-12 20:06:42', '2026-10-13 04:06:42', '2026-10-12 20:06:42', '2026-10-12 20:06:42');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('12', 'App\\Models\\User', '1', 'semilla-session', '52211cdf23dde0591e2d690f3af5a6075384e0479e54870ac6c12265f02e98a1', '[\"*\"]', '2026-10-12 20:07:36', '2026-10-13 04:07:36', '2026-10-12 20:07:36', '2026-10-12 20:07:36');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('13', 'App\\Models\\User', '1', 'semilla-session', '4ffe15bc8c15f16639e5f03473581271161c1421d84a27f44e7d58a3a90ae822', '[\"*\"]', '2026-10-12 20:08:28', '2026-10-13 04:08:28', '2026-10-12 20:08:28', '2026-10-12 20:08:28');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('14', 'App\\Models\\User', '1', 'semilla-session', '8fc8feb98e7bff54140e45226d2468fee17aca9cd9751e06511a7d5f3d5c7110', '[\"*\"]', '2026-10-12 20:16:51', '2026-10-13 04:16:51', '2026-10-12 20:16:51', '2026-10-12 20:16:51');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('15', 'App\\Models\\User', '1', 'semilla-session', 'bb565d17ea13d7eeb8c746ccdab9ccd0d430c3490da6b2730ca2bdaaedb28ace', '[\"*\"]', '2026-10-12 20:19:36', '2026-10-13 04:19:36', '2026-10-12 20:19:36', '2026-10-12 20:19:36');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('16', 'App\\Models\\User', '1', 'semilla-session', 'a3ebb86eea6b92e037bc8c6043fb2c7de5e0a4bacc360f705b146f45fbf905ac', '[\"*\"]', '2026-10-12 23:30:17', '2026-10-13 07:30:12', '2026-10-12 23:30:12', '2026-10-12 23:30:17');
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES ('17', 'App\\Models\\User', '1', 'semilla-session', 'd983add502bcb35c36195f55674704aa8458798c694e196cff55c03393c1a7ab', '[\"*\"]', '2026-10-12 23:32:01', '2026-10-13 07:31:59', '2026-10-12 23:31:59', '2026-10-12 23:32:01');

-- ------------------------------------------------------------
-- Estructura para tabla: `reniec_cache`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `reniec_cache`;
CREATE TABLE `reniec_cache` (
  `dni` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json NOT NULL,
  `cached_at` timestamp NOT NULL,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para tabla: `reniec_cache`
INSERT INTO `reniec_cache` (`dni`, `data`, `cached_at`, `expires_at`) VALUES ('04652237', '{\"sexo\": \"M\", \"source\": \"Padrón de Contingencia Rural\", \"nombres\": \"JOSÉ LUIS\", \"telefono\": \"984 052237\", \"comunidad\": \"rumichaca\", \"direccion\": \"Comunidad Campesina Valle Sagrado\", \"apellidoMaterno\": \"QUISPE\", \"apellidoPaterno\": \"CCORI\", \"fechaNacimiento\": \"1997-02-18\", \"ubigeoNacimiento\": \"080101\"}', '2026-10-12 21:58:22', '2026-11-11 21:58:22');
INSERT INTO `reniec_cache` (`dni`, `data`, `cached_at`, `expires_at`) VALUES ('45892104', '{\"sexo\": \"M\", \"source\": \"Padrón Comunal Cusco - Valle Sagrado\", \"nombres\": \"SANTOS FAUSTINO\", \"telefono\": \"984 312 809\", \"comunidad\": \"rumichaca\", \"direccion\": \"Comunidad Rumichaca Sector Alto\", \"apellidoMaterno\": \"HUAMÁN\", \"apellidoPaterno\": \"QUISPE\", \"fechaNacimiento\": \"1968-08-14\", \"ubigeoNacimiento\": \"080101\"}', '2026-10-12 19:57:26', '2026-11-11 19:57:26');

-- ------------------------------------------------------------
-- Estructura para tabla: `role_has_permissions`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `role_has_permissions`;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `roles`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `sessions`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `stations`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `stations`;
CREATE TABLE `stations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` bigint unsigned NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('admision','triaje','medico','farmacia','pediatria','otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `printer_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stations_campaign_id_code_unique` (`campaign_id`,`code`),
  CONSTRAINT `stations_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para tabla: `stations`
INSERT INTO `stations` (`id`, `campaign_id`, `code`, `type`, `label`, `printer_id`, `active`, `created_at`, `updated_at`) VALUES ('1', '1', 'ADM-01', 'admision', 'Mesa Admision 01', 'BT-POS-01', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `stations` (`id`, `campaign_id`, `code`, `type`, `label`, `printer_id`, `active`, `created_at`, `updated_at`) VALUES ('2', '1', 'TRI-02', 'triaje', 'Box Triaje B-02', NULL, '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `stations` (`id`, `campaign_id`, `code`, `type`, `label`, `printer_id`, `active`, `created_at`, `updated_at`) VALUES ('3', '1', 'MED-01', 'medico', 'Consultorio 1', 'BT-POS-01', '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `stations` (`id`, `campaign_id`, `code`, `type`, `label`, `printer_id`, `active`, `created_at`, `updated_at`) VALUES ('4', '1', 'PED-02', 'pediatria', 'Consultorio 2 - Pediatria', NULL, '1', '2026-10-12 19:41:02', '2026-10-12 19:41:02');

-- ------------------------------------------------------------
-- Estructura para tabla: `sync_logs`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `sync_logs`;
CREATE TABLE `sync_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `node_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `operation` enum('INSERT','UPDATE','DELETE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` json NOT NULL,
  `synced` tinyint(1) NOT NULL DEFAULT '0',
  `synced_at` datetime DEFAULT NULL,
  `conflict` tinyint(1) NOT NULL DEFAULT '0',
  `conflict_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sync_logs_node_id_synced_index` (`node_id`,`synced`),
  KEY `sync_logs_entity_type_entity_id_index` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `system_settings`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `tickets_termicos`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tickets_termicos`;
CREATE TABLE `tickets_termicos` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `atencion_id` bigint unsigned NOT NULL,
  `tipo` enum('admision','receta','referencia','cierre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `printer_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contenido_raw` text COLLATE utf8mb4_unicode_ci,
  `escpos_base64` text COLLATE utf8mb4_unicode_ci,
  `qr_code` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `printed_at` datetime DEFAULT NULL,
  `printed_by` bigint unsigned DEFAULT NULL,
  `bt_device_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tickets_termicos_atencion_id_foreign` (`atencion_id`),
  KEY `tickets_termicos_printed_by_foreign` (`printed_by`),
  CONSTRAINT `tickets_termicos_atencion_id_foreign` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_termicos_printed_by_foreign` FOREIGN KEY (`printed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `triajes`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `triajes`;
CREATE TABLE `triajes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `atencion_id` bigint unsigned NOT NULL,
  `temperatura_c` decimal(4,1) DEFAULT NULL,
  `presion_sistolica` smallint DEFAULT NULL,
  `presion_diastolica` smallint DEFAULT NULL,
  `frecuencia_cardiaca` smallint DEFAULT NULL,
  `frecuencia_respiratoria` tinyint DEFAULT NULL,
  `saturacion_o2_pct` tinyint DEFAULT NULL,
  `glucosa_mg_dl` smallint DEFAULT NULL,
  `peso_kg` decimal(5,2) DEFAULT NULL,
  `talla_cm` decimal(5,1) DEFAULT NULL,
  `imc` decimal(4,1) DEFAULT NULL,
  `altitud_atencion_masl` int DEFAULT NULL,
  `saturacion_corregida` tinyint DEFAULT NULL,
  `prioridad` enum('I','II','III') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'III',
  `prioridad_label` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prioridad_color` enum('rojo','amarillo','verde') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'verde',
  `sintoma_principal` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alergias_activas` json DEFAULT NULL,
  `alertas_clinicas` json DEFAULT NULL,
  `motivo_consulta` text COLLATE utf8mb4_unicode_ci,
  `observaciones_triaje` text COLLATE utf8mb4_unicode_ci,
  `enfermera_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `triajes_atencion_id_unique` (`atencion_id`),
  KEY `triajes_enfermera_id_foreign` (`enfermera_id`),
  CONSTRAINT `triajes_atencion_id_foreign` FOREIGN KEY (`atencion_id`) REFERENCES `atenciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `triajes_enfermera_id_foreign` FOREIGN KEY (`enfermera_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estructura para tabla: `users`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cmp_code` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','medico','triaje','admision','guardia') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admision',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pin_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `biometric_hash` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_fisico` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `station_default` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_cmp_code_unique` (`cmp_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos para tabla: `users`
INSERT INTO `users` (`id`, `cmp_code`, `dni`, `name`, `apellidos`, `role`, `email`, `email_verified_at`, `password`, `pin_hash`, `biometric_hash`, `token_fisico`, `station_default`, `active`, `last_login_at`, `remember_token`, `created_at`, `updated_at`) VALUES ('1', 'ADMIN-001', NULL, 'Administrador', 'Semilla', 'admin', 'admin@semilla.pe', NULL, '$2y$12$lV4sMIvK1zUTOF0PaM1jJOkOtAw/8w91WSRwrxc039sarC3/lDpw6', '$2y$12$zvXZABnr2YEBSO.NtXZXKu1P1xspgQjx5w57pkNiiC0Syv8lBbAHa', NULL, NULL, NULL, '1', '2026-10-12 23:31:59', NULL, '2026-10-12 19:41:02', '2026-10-12 23:31:59');
INSERT INTO `users` (`id`, `cmp_code`, `dni`, `name`, `apellidos`, `role`, `email`, `email_verified_at`, `password`, `pin_hash`, `biometric_hash`, `token_fisico`, `station_default`, `active`, `last_login_at`, `remember_token`, `created_at`, `updated_at`) VALUES ('2', 'CMP-89241', '45892104', 'Marco', 'Huaman Quispe', 'medico', 'mhuaman@semilla.pe', NULL, '$2y$12$EOf/ZKprf7NuupvyU6p69.71mv.rthC8LritBiAJohTrWeLJY1jNm', '$2y$12$cwlr9mPOSAxxiQGK4c.rS.LQl7e38rtv0VULuCna9qgt14cwcCTd2', NULL, NULL, 'MED-01', '1', NULL, NULL, '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `users` (`id`, `cmp_code`, `dni`, `name`, `apellidos`, `role`, `email`, `email_verified_at`, `password`, `pin_hash`, `biometric_hash`, `token_fisico`, `station_default`, `active`, `last_login_at`, `remember_token`, `created_at`, `updated_at`) VALUES ('3', 'CMP-92017', NULL, 'Sofia', 'Benavides Roca', 'triaje', 'sbenavides@semilla.pe', NULL, '$2y$12$4Sxeahn4uZ96H2XeBOpQXeYbft/.McXSVvLSYXzsrBzUQ2J2Iido6', '$2y$12$crVzXyUyZa6sPLjRT1cUze8682onmWZDsBrZLZV9c9MTRux.yHKEG', NULL, NULL, 'TRI-02', '1', NULL, NULL, '2026-10-12 19:41:02', '2026-10-12 19:41:02');
INSERT INTO `users` (`id`, `cmp_code`, `dni`, `name`, `apellidos`, `role`, `email`, `email_verified_at`, `password`, `pin_hash`, `biometric_hash`, `token_fisico`, `station_default`, `active`, `last_login_at`, `remember_token`, `created_at`, `updated_at`) VALUES ('4', NULL, NULL, 'Ana', 'Torres Mamani', 'admision', 'atorres@semilla.pe', NULL, '$2y$12$J78sTlmtqEscfKDc8ITz/.7srk.9Hl9MyF42KQ/4bn30dUf5r.Vmi', NULL, NULL, NULL, 'ADM-01', '1', NULL, NULL, '2026-10-12 19:41:02', '2026-10-12 19:41:02');


-- ------------------------------------------------------------
-- Estructura para tabla: `audit_records` (Telemetria y Auditoria Forense)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `audit_records`;
CREATE TABLE `audit_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `user_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_dni` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `station` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `route_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `status_code` int NOT NULL,
  `duration_ms` double(8,2) DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_local_ip` tinyint(1) NOT NULL DEFAULT '0',
  `hostname` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `network_effective_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `network_rtt_ms` int DEFAULT NULL,
  `network_downlink_mbps` double(8,2) DEFAULT NULL,
  `network_save_data` tinyint(1) NOT NULL DEFAULT '0',
  `device_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_os` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_browser` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `screen_resolution` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_timezone` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_language` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `request_payload` json DEFAULT NULL,
  `response_summary` json DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_records_user_id_index` (`user_id`),
  KEY `audit_records_endpoint_index` (`endpoint`),
  KEY `audit_records_status_code_index` (`status_code`),
  KEY `audit_records_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
