-- ========================================================
-- ElRond - Sistema de Gestión Médica (Módulo de Triaje)
-- Volcado completo de Estructura y Datos (DDL + DML)
-- Base de datos: triaje_semilla
-- Fecha de generación: 2026-09-27 01:30:07
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Estructura de tabla para `atenciones`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `audit_logs`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `beneficiarios`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `cache`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla para `cache_locks`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla para `campaign_users`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `campaigns`
-- --------------------------------------------------------
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

-- Volcado de datos para `campaigns`
INSERT INTO `campaigns` VALUES (1, 'CMP-2025-CUS-02', 'Cusco - Valle Sagrado 2025', 'Salon Comunal Rumichaca', 'Urubamba', 'Cusco', 2870, '2025-04-01', NULL, 'active', 'CUS-VALLE-04', 1, NULL, NULL, '2026-09-18 10:48:31', '2026-09-18 10:48:31');

-- --------------------------------------------------------
-- Estructura de tabla para `consultas`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `failed_jobs`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `job_batches`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `jobs`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `medicamentos`
-- --------------------------------------------------------
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

-- Volcado de datos para `medicamentos`
INSERT INTO `medicamentos` VALUES (1, 'Paracetamol', NULL, '500mg', 'tableta', 'oral', 500, 10, 1, '2026-09-18 10:48:31', '2026-09-18 10:48:31'),
(2, 'Paracetamol', NULL, '1g', 'tableta', 'oral', 200, 10, 1, '2026-09-18 10:48:31', '2026-09-18 10:48:31'),
(3, 'Ibuprofeno', NULL, '400mg', 'tableta', 'oral', 300, 10, 1, '2026-09-18 10:48:31', '2026-09-18 10:48:31'),
(4, 'Amoxicilina', NULL, '500mg', 'capsula', 'oral', 200, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(5, 'Enalapril', NULL, '10mg', 'tableta', 'oral', 150, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(6, 'Metformina', NULL, '850mg', 'tableta', 'oral', 100, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(7, 'Amlodipino', NULL, '5mg', 'tableta', 'oral', 100, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(8, 'Omeprazol', NULL, '20mg', 'capsula', 'oral', 200, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(9, 'Loratadina', NULL, '10mg', 'tableta', 'oral', 150, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(10, 'Azitromicina', NULL, '500mg', 'tableta', 'oral', 80, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(11, 'Ciprofloxacino', NULL, '500mg', 'tableta', 'oral', 80, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(12, 'Diclofenaco', NULL, '50mg', 'tableta', 'oral', 120, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(13, 'Metronidazol', NULL, '500mg', 'tableta', 'oral', 100, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(14, 'Sulfato Ferroso', NULL, '200mg', 'tableta', 'oral', 200, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(15, 'Vitamina C', NULL, '500mg', 'tableta', 'oral', 300, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(16, 'Atorvastatina', NULL, '20mg', 'tableta', 'oral', 60, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(17, 'Salbutamol', NULL, '100mcg', 'otro', 'inhalada', 30, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(18, 'Suero Oral', NULL, 'Sachet', 'solucion', 'oral', 400, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(19, 'Dimenhidrinato', NULL, '50mg', 'tableta', 'oral', 100, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(20, 'Ketorolaco', NULL, '30mg/ml', 'inyectable', 'IM', 50, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(21, 'Dexametasona', NULL, '4mg/ml', 'inyectable', 'IM', 30, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(22, 'Furosemida', NULL, '40mg', 'tableta', 'oral', 40, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(23, 'Captopril', NULL, '25mg', 'tableta', 'oral', 80, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(24, 'Betametasona', NULL, '0.05%', 'crema', 'topica', 30, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32'),
(25, 'Diazepam', NULL, '5mg', 'tableta', 'oral', 20, 10, 1, '2026-09-18 10:48:32', '2026-09-18 10:48:32');

-- --------------------------------------------------------
-- Estructura de tabla para `migrations`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para `migrations`
INSERT INTO `migrations` VALUES (1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_09_18_041700_create_personal_access_tokens_table', 1),
(5, '2026_09_18_041701_create_permission_tables', 1),
(6, '2026_09_18_100000_alter_users_add_medical_fields', 1),
(7, '2026_09_18_100001_create_campaigns_table', 1),
(8, '2026_09_18_100002_create_stations_table', 1),
(9, '2026_09_18_100003_create_beneficiarios_table', 1),
(10, '2026_09_18_100004_create_atenciones_table', 1),
(11, '2026_09_18_100005_create_triajes_table', 1),
(12, '2026_09_18_100006_create_medicamentos_table', 1),
(13, '2026_09_18_100007_create_consultas_table', 1),
(14, '2026_09_18_100008_create_tickets_termicos_table', 1),
(15, '2026_09_18_100009_create_campaign_users_table', 1),
(16, '2026_09_18_100010_create_sync_logs_table', 1),
(17, '2026_09_18_100011_create_audit_logs_table', 1),
(18, '2026_09_18_100012_create_reniec_cache_table', 1),
(19, '2026_09_22_100001_create_system_settings_table', 2),
(20, '2026_09_22_100002_create_audit_records_on_audi_triaje', 2),
(21, '2026_09_26_170000_add_email_verification_and_volunteer_roles_to_users', 3);

-- --------------------------------------------------------
-- Estructura de tabla para `model_has_permissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `model_has_permissions`;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla para `model_has_roles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `model_has_roles`;
CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla para `password_reset_tokens`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla para `permissions`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `personal_access_tokens`
-- --------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para `personal_access_tokens`
INSERT INTO `personal_access_tokens` VALUES (1, 'App\\Models\\User', 1, 'semilla-session', '1010d048dc71dd2b28590ddaf736a353628d78b847487500f63828d4559df30a', '[\"*\"]', NULL, '2026-09-18 19:41:37', '2026-09-18 11:41:37', '2026-09-18 11:41:37'),
(2, 'App\\Models\\User', 1, 'semilla-session', '32303efaf698b8d93b200495f27dc3b7ae320f4c050e2e34e98db9b67e5e0364', '[\"*\"]', '2026-09-18 11:43:11', '2026-09-18 19:42:51', '2026-09-18 11:42:51', '2026-09-18 11:43:11'),
(3, 'App\\Models\\User', 1, 'semilla-session', 'e7a3e0562b1733bd02dfb8bebe1d8560065c9cbe5350d424c7f8d465f69037c5', '[\"*\"]', '2026-09-18 12:00:24', '2026-09-18 19:43:46', '2026-09-18 11:43:46', '2026-09-18 12:00:24'),
(4, 'App\\Models\\User', 1, 'semilla-session', '2267d4ab8249c3a6ac33b9e967885278cddcfbf00c871b366406038fabe51ca4', '[\"*\"]', NULL, '2026-09-19 09:57:56', '2026-09-19 01:57:56', '2026-09-19 01:57:56'),
(8, 'App\\Models\\User', 1, 'semilla-session', '06a674070d7a5fc279efff331a5f623238be2e051f3a19622160633088158ec4', '[\"*\"]', '2026-09-19 05:43:40', '2026-09-19 12:57:37', '2026-09-19 04:57:37', '2026-09-19 05:43:40'),
(9, 'App\\Models\\User', 1, 'semilla-session', '055d79050e1cc480e89502981d026e6adb3a45169302222fc8f9f51807a3e80b', '[\"*\"]', '2026-09-19 13:03:04', '2026-09-19 18:01:31', '2026-09-19 10:01:31', '2026-09-19 13:03:04'),
(10, 'App\\Models\\User', 1, 'semilla-session', '50e6b816d547157774881a45613a4368c346e5ca68fa37117b3f1530d4d4e879', '[\"*\"]', NULL, '2026-09-19 20:38:30', '2026-09-19 12:38:30', '2026-09-19 12:38:30'),
(11, 'App\\Models\\User', 1, 'semilla-pin', '9e7c52d8670b5e1a1e1d0ae8156f069aa6ac60434382e26df31c9dfab95cceec', '[\"*\"]', NULL, '2026-09-19 16:39:06', '2026-09-19 12:39:06', '2026-09-19 12:39:06'),
(12, 'App\\Models\\User', 1, 'semilla-session', '9ed96bfe29bd49c21f5a5124eb99edfeb45506444f281752a18ec8bca51050aa', '[\"*\"]', NULL, '2026-09-19 20:47:56', '2026-09-19 12:47:56', '2026-09-19 12:47:56'),
(13, 'App\\Models\\User', 1, 'semilla-pin', '0e45d969cc9c27e540f212a2ae6bdf6aede6b0b0b6c77b48f296eb0bacd2667d', '[\"*\"]', '2026-09-19 12:49:18', '2026-09-19 16:49:18', '2026-09-19 12:49:18', '2026-09-19 12:49:18'),
(14, 'App\\Models\\User', 1, 'semilla-session', 'a006bc1567bba181918472b4784163797192835df89d62bd4bc75d1b98c37931', '[\"*\"]', '2026-09-19 12:50:45', '2026-09-19 20:50:45', '2026-09-19 12:50:45', '2026-09-19 12:50:45'),
(15, 'App\\Models\\User', 1, 'semilla-pin', '44ae0b13a7e37d46ff5dd8d26b81626bba2dbd882ad61e069cc9f5b7b4d7dd7a', '[\"*\"]', '2026-09-19 12:50:47', '2026-09-19 16:50:47', '2026-09-19 12:50:47', '2026-09-19 12:50:47'),
(16, 'App\\Models\\User', 1, 'semilla-session', 'df44b5f96fe7aa48542716469cc694db29f8a7bcb90865557188993ea140de50', '[\"*\"]', '2026-09-19 12:50:51', '2026-09-19 20:50:49', '2026-09-19 12:50:49', '2026-09-19 12:50:51'),
(17, 'App\\Models\\User', 1, 'semilla-session', 'cc477b3d973d85698e012fcb5db4a43b41f08d8af15a9bd5b28d876ef1bec4ff', '[\"*\"]', '2026-09-19 12:51:37', '2026-09-19 20:51:36', '2026-09-19 12:51:36', '2026-09-19 12:51:37'),
(18, 'App\\Models\\User', 1, 'semilla-pin', '24eedcea9b262408a67bd211891eb5be5b49afac1463016a5461c306e7944c47', '[\"*\"]', '2026-09-19 12:51:39', '2026-09-19 16:51:39', '2026-09-19 12:51:39', '2026-09-19 12:51:39'),
(19, 'App\\Models\\User', 1, 'semilla-session', '7e4136149ad03fe4f6b8e99d8912c44c42810d7e02480fc151ba9f30a7f737c9', '[\"*\"]', '2026-09-19 12:51:43', '2026-09-19 20:51:42', '2026-09-19 12:51:42', '2026-09-19 12:51:43'),
(20, 'App\\Models\\User', 1, 'semilla-session', 'af2f6747e99b5c5a91a04123ab28b8737249606e42ec58744f31b2f45f4754df', '[\"*\"]', '2026-09-19 12:52:10', '2026-09-19 20:52:10', '2026-09-19 12:52:10', '2026-09-19 12:52:10'),
(21, 'App\\Models\\User', 1, 'semilla-pin', 'fb26cd319f729bdbb8b2afe8932c61e8d8c127da2f9dce273d59af244d2b29db', '[\"*\"]', '2026-09-19 12:52:13', '2026-09-19 16:52:13', '2026-09-19 12:52:13', '2026-09-19 12:52:13'),
(22, 'App\\Models\\User', 1, 'semilla-session', 'b0238d369cfd43f5c08124e83e267ccacf9c86dc8aaec5186270d45ea7b939ce', '[\"*\"]', '2026-09-19 12:52:18', '2026-09-19 20:52:15', '2026-09-19 12:52:15', '2026-09-19 12:52:18'),
(23, 'App\\Models\\User', 1, 'semilla-session', '91086fd3b683df8fce6db83186d332c9ab42bd15520ba44de9247f028a060f20', '[\"*\"]', '2026-09-19 13:03:42', '2026-09-19 21:03:42', '2026-09-19 13:03:42', '2026-09-19 13:03:42'),
(24, 'App\\Models\\User', 1, 'semilla-pin', 'd40143d5b26dab54f6fdb72829fb5b2ad65a80769ccec63b53bd5fe1248d4f1c', '[\"*\"]', '2026-09-19 13:03:45', '2026-09-19 17:03:45', '2026-09-19 13:03:45', '2026-09-19 13:03:45'),
(25, 'App\\Models\\User', 1, 'semilla-session', '3a9352b34ce219f250e659489d0d4fa2d2e470e1581636628ed71fe406f77b76', '[\"*\"]', '2026-09-19 13:03:48', '2026-09-19 21:03:47', '2026-09-19 13:03:47', '2026-09-19 13:03:48'),
(26, 'App\\Models\\User', 1, 'semilla-session', '2eb9b14aa46b63e897866ca81ee6301dac1a19971cd69f2d49f2b85471b18f29', '[\"*\"]', '2026-09-19 13:04:26', '2026-09-19 21:04:26', '2026-09-19 13:04:26', '2026-09-19 13:04:26'),
(27, 'App\\Models\\User', 1, 'semilla-pin', '9fa584d4b6e58b89d117139f94ede8a56fc5935ac713c6b2c38fed828c89f08d', '[\"*\"]', '2026-09-19 13:04:29', '2026-09-19 17:04:28', '2026-09-19 13:04:28', '2026-09-19 13:04:29'),
(28, 'App\\Models\\User', 1, 'semilla-session', '91019dccaf7a77da6ac24882821c2536b843171873a25599420b2f23196a84d0', '[\"*\"]', '2026-09-19 13:04:34', '2026-09-19 21:04:31', '2026-09-19 13:04:31', '2026-09-19 13:04:34'),
(29, 'App\\Models\\User', 1, 'semilla-session', '0177c4854841249032c0950517e15d96a04d723ed3daf9fc1b211eb17a857af0', '[\"*\"]', '2026-09-19 13:08:51', '2026-09-19 21:08:50', '2026-09-19 13:08:50', '2026-09-19 13:08:51'),
(30, 'App\\Models\\User', 1, 'semilla-session', 'c8cb6df1a02ab4fd817a6d24fa4db895457fea18063ab01737f401ff3db0da9b', '[\"*\"]', '2026-09-19 13:30:30', '2026-09-19 21:14:48', '2026-09-19 13:14:48', '2026-09-19 13:30:30'),
(31, 'App\\Models\\User', 1, 'semilla-session', 'b745e30ee2c83f4da8d27914b9827900c398570486f31c3357e4c8dd5fd4357f', '[\"*\"]', '2026-09-19 13:16:02', '2026-09-19 21:16:02', '2026-09-19 13:16:02', '2026-09-19 13:16:02'),
(32, 'App\\Models\\User', 1, 'semilla-pin', '0f9677a117e1108ead3b0935faa2399919eda6c70a1f60f7ea03c9185b58c69e', '[\"*\"]', '2026-09-19 13:16:05', '2026-09-19 17:16:05', '2026-09-19 13:16:05', '2026-09-19 13:16:05'),
(33, 'App\\Models\\User', 1, 'semilla-session', '5076ba39ac62916675c61a7c20cae3c8cdabe9a19fa03af15d76ef4ede0a2107', '[\"*\"]', '2026-09-19 13:16:10', '2026-09-19 21:16:07', '2026-09-19 13:16:07', '2026-09-19 13:16:10'),
(34, 'App\\Models\\User', 1, 'semilla-session', '2598daf63ccfd8256b9e66a754fd2e93eca6a152d3a054b8a51b2839b856c1a4', '[\"*\"]', '2026-09-19 13:16:14', '2026-09-19 21:16:14', '2026-09-19 13:16:14', '2026-09-19 13:16:14'),
(35, 'App\\Models\\User', 1, 'semilla-session', 'dc32c9c8bbd374bda4a8f33ce66c9e495c8833203b08a9e71844a64f2bc9e9d0', '[\"*\"]', '2026-09-19 13:22:32', '2026-09-19 21:22:32', '2026-09-19 13:22:32', '2026-09-19 13:22:32'),
(36, 'App\\Models\\User', 1, 'semilla-pin', '23cada9bdb8c7ebb90468d6081129e42ffe1cf930ee1b9d419500e3c3eaba4b1', '[\"*\"]', '2026-09-19 13:22:35', '2026-09-19 17:22:35', '2026-09-19 13:22:35', '2026-09-19 13:22:35'),
(37, 'App\\Models\\User', 1, 'semilla-session', '80e5b4f2876fd26cd48ae3c6f663fa16a3a46d5a3d704804fe3548694c28d76a', '[\"*\"]', '2026-09-19 13:22:40', '2026-09-19 21:22:37', '2026-09-19 13:22:37', '2026-09-19 13:22:40'),
(38, 'App\\Models\\User', 1, 'semilla-session', 'fbab0952de43ad3e550adec56a9c44c192aa71563ae16c26ff3a38a59e786540', '[\"*\"]', '2026-09-19 13:22:43', '2026-09-19 21:22:43', '2026-09-19 13:22:43', '2026-09-19 13:22:43'),
(39, 'App\\Models\\User', 1, 'semilla-session', 'd8ca57f7808bb7e4f09b619c2399e0478c77c7195c8c2cb8b97af036ba1e5530', '[\"*\"]', '2026-09-19 13:22:54', '2026-09-19 21:22:51', '2026-09-19 13:22:51', '2026-09-19 13:22:54'),
(40, 'App\\Models\\User', 1, 'semilla-session', 'c0cf4ca33988141748bda8b6f5e505ceb6c99f19807d8856e422145dfe3562ca', '[\"*\"]', '2026-09-20 00:39:22', '2026-09-20 07:38:22', '2026-09-19 23:38:22', '2026-09-20 00:39:22'),
(41, 'App\\Models\\User', 1, 'semilla-session', 'fd8716dfe87e6a5e3e2467e5cb4b3f8418741be3af3271a1b0617b9d3302d871', '[\"*\"]', '2026-09-20 00:12:26', '2026-09-20 08:12:25', '2026-09-20 00:12:25', '2026-09-20 00:12:26'),
(42, 'App\\Models\\User', 1, 'semilla-session', '419ebf14f37ce3da1daa46eacda2e6c9029f63c070406fad46cfe56cf3d92453', '[\"*\"]', '2026-09-20 00:13:23', '2026-09-20 08:13:21', '2026-09-20 00:13:21', '2026-09-20 00:13:23'),
(43, 'App\\Models\\User', 1, 'semilla-session', '0adce93db5c2e7fa5865634753ce309cd8efcc1717226b7bccfceda31ede2ec1', '[\"*\"]', '2026-09-20 00:13:51', '2026-09-20 08:13:51', '2026-09-20 00:13:51', '2026-09-20 00:13:51'),
(44, 'App\\Models\\User', 1, 'semilla-session', '1247b6fc64932339b715b4f314f0720d636cf537c49d4dfcd1db6095fde3d4d8', '[\"*\"]', '2026-09-20 00:16:52', '2026-09-20 08:16:52', '2026-09-20 00:16:52', '2026-09-20 00:16:52'),
(45, 'App\\Models\\User', 1, 'semilla-session', 'c5a44204f92568db8c2180dcf364bf9e7121f69e9b61ea75c61d24848b1440ad', '[\"*\"]', '2026-09-20 00:24:39', '2026-09-20 08:24:39', '2026-09-20 00:24:39', '2026-09-20 00:24:39'),
(46, 'App\\Models\\User', 1, 'semilla-session', '098a29ec0f2391e373560f0f5ef72f2c22d85d95bfb2317412da8bf57c633932', '[\"*\"]', '2026-09-20 00:24:43', '2026-09-20 08:24:43', '2026-09-20 00:24:43', '2026-09-20 00:24:43'),
(47, 'App\\Models\\User', 1, 'semilla-session', 'a0be1abbd6ccf75fe507b821a1c2c51ea161a6683074df1ed07a2fa05537612c', '[\"*\"]', '2026-09-20 00:24:46', '2026-09-20 08:24:46', '2026-09-20 00:24:46', '2026-09-20 00:24:46'),
(48, 'App\\Models\\User', 1, 'semilla-session', '4326b44964cdedd046a883fea4d304b8d781cbf2d20fb89ffdaf0902b3b6b42b', '[\"*\"]', '2026-09-20 00:25:51', '2026-09-20 08:25:51', '2026-09-20 00:25:51', '2026-09-20 00:25:51'),
(49, 'App\\Models\\User', 1, 'semilla-session', 'ef92b0c5976b3599443201affb06993933b386bec5f25fb030cf02916f4e1a5e', '[\"*\"]', '2026-09-20 00:25:53', '2026-09-20 08:25:53', '2026-09-20 00:25:53', '2026-09-20 00:25:53'),
(50, 'App\\Models\\User', 1, 'semilla-session', '777d8993ef67afcb8d2687f2b18ca16fc0cd470aabf2f0d91f652426cc93f171', '[\"*\"]', '2026-09-20 00:25:57', '2026-09-20 08:25:56', '2026-09-20 00:25:56', '2026-09-20 00:25:57'),
(51, 'App\\Models\\User', 1, 'semilla-session', 'e5208f484627911ae30e9e2e5e013f5f80a83a0a6631e607fc620fe9dd10aeed', '[\"*\"]', '2026-09-20 00:26:27', '2026-09-20 08:26:27', '2026-09-20 00:26:27', '2026-09-20 00:26:27'),
(52, 'App\\Models\\User', 1, 'semilla-pin', '2b274ed3903c4a9e2f5ce4504087395f20ecbdaf261388df47b839e74587e6c2', '[\"*\"]', '2026-09-20 00:26:29', '2026-09-20 04:26:29', '2026-09-20 00:26:29', '2026-09-20 00:26:29'),
(53, 'App\\Models\\User', 1, 'semilla-session', 'ac34b7a5c37aa03c001ee29fb3bf3d391bb6e7c2b2000f5238af69af93e658b3', '[\"*\"]', '2026-09-20 00:26:33', '2026-09-20 08:26:31', '2026-09-20 00:26:31', '2026-09-20 00:26:33'),
(54, 'App\\Models\\User', 1, 'semilla-session', 'a56cdc4901261886cd7d8955d6e92bbf241acb7f7e030af2cd0cd7c70d4e1460', '[\"*\"]', '2026-09-20 00:26:35', '2026-09-20 08:26:35', '2026-09-20 00:26:35', '2026-09-20 00:26:35'),
(55, 'App\\Models\\User', 1, 'semilla-session', 'dd109e8f52e644df90b8b1be0e1b4a47301024dd943e8afa7276dfee11a9a875', '[\"*\"]', '2026-09-20 00:26:43', '2026-09-20 08:26:41', '2026-09-20 00:26:41', '2026-09-20 00:26:43'),
(56, 'App\\Models\\User', 1, 'semilla-session', '99676f6e018c958277ee1b0c1e53ca371253b3055a114f21440208e2e8c39571', '[\"*\"]', '2026-09-20 04:11:10', '2026-09-20 08:59:49', '2026-09-20 00:59:49', '2026-09-20 04:11:10'),
(57, 'App\\Models\\User', 1, 'semilla-session', '27fce45cb2c4fca6b581149d27745b2a3e64986f10e778a24455d945077ef3af', '[\"*\"]', '2026-09-20 01:04:40', '2026-09-20 09:04:40', '2026-09-20 01:04:40', '2026-09-20 01:04:40'),
(58, 'App\\Models\\User', 1, 'semilla-session', 'b38bed0e70b18e1fcf251eeac14ab06a3d1c2bb383f39c07d8686af55416f28b', '[\"*\"]', '2026-09-20 01:04:42', '2026-09-20 09:04:42', '2026-09-20 01:04:42', '2026-09-20 01:04:42'),
(59, 'App\\Models\\User', 1, 'semilla-session', 'b629bcfdeadaf74d5b0b3ebc28e17324bc2a00cee441b3606eeaa77d91bafa3c', '[\"*\"]', '2026-09-20 01:04:45', '2026-09-20 09:04:45', '2026-09-20 01:04:45', '2026-09-20 01:04:45'),
(60, 'App\\Models\\User', 1, 'semilla-session', '7ebb11b4d678405dfd66c1aba4d95435995fa4bf3e5024b4416eb0b619014203', '[\"*\"]', '2026-09-20 01:14:28', '2026-09-20 09:14:28', '2026-09-20 01:14:28', '2026-09-20 01:14:28'),
(61, 'App\\Models\\User', 1, 'semilla-session', 'd43d5b6775a10f35bf7a9109af692032848aeb4a7820e3d4e51de3ea6b88dda6', '[\"*\"]', '2026-09-20 01:14:31', '2026-09-20 09:14:31', '2026-09-20 01:14:31', '2026-09-20 01:14:31'),
(62, 'App\\Models\\User', 1, 'semilla-session', '7d020469ef271aeaaf0f2cad5fd2c9981d80739583dab72949f4402135674adb', '[\"*\"]', '2026-09-20 01:14:34', '2026-09-20 09:14:34', '2026-09-20 01:14:34', '2026-09-20 01:14:34'),
(63, 'App\\Models\\User', 1, 'semilla-session', 'ddb1a4e670a1240272800c44d30197c22b88b6e793f80604716bc82f793338f0', '[\"*\"]', '2026-09-20 03:28:36', '2026-09-20 11:28:36', '2026-09-20 03:28:36', '2026-09-20 03:28:36'),
(64, 'App\\Models\\User', 1, 'semilla-session', '3a96dc6fc2236fd444c1e8dc99fc45e943bc637f807130f1f0a21ce630c7a613', '[\"*\"]', '2026-09-20 03:28:52', '2026-09-20 11:28:52', '2026-09-20 03:28:52', '2026-09-20 03:28:52'),
(65, 'App\\Models\\User', 1, 'semilla-session', 'ff9f4061d7b10ed63e778c0274dfc7fbb9eed78704796a2eb2ab875749e931ce', '[\"*\"]', '2026-09-20 03:29:16', '2026-09-20 11:29:16', '2026-09-20 03:29:16', '2026-09-20 03:29:16'),
(66, 'App\\Models\\User', 1, 'semilla-session', 'ae9c0b6ec3a2cb2cde3891635405f45497961fc205317f56c9e74286e55f4118', '[\"*\"]', '2026-09-20 03:31:33', '2026-09-20 11:31:33', '2026-09-20 03:31:33', '2026-09-20 03:31:33'),
(67, 'App\\Models\\User', 1, 'semilla-session', 'a3d5a38f46ef65bdb45d465f2ba59b4040efe60c4bc9a6dfe5dbe4873a9befdd', '[\"*\"]', '2026-09-20 03:31:35', '2026-09-20 11:31:35', '2026-09-20 03:31:35', '2026-09-20 03:31:35'),
(68, 'App\\Models\\User', 1, 'semilla-session', 'a18904aac15d25e025ced8e3225785fbfa1eff95d7130198ea20ef9066f1258f', '[\"*\"]', '2026-09-20 03:31:39', '2026-09-20 11:31:38', '2026-09-20 03:31:38', '2026-09-20 03:31:39'),
(69, 'App\\Models\\User', 1, 'semilla-session', '115b77ed6fa5d5e5e7c9e02ff499b77e14449fc6d960abec93966f1251572246', '[\"*\"]', NULL, '2026-09-20 12:06:37', '2026-09-20 04:06:37', '2026-09-20 04:06:37'),
(70, 'App\\Models\\User', 1, 'semilla-session', '831b6e52ae93a312ee7719242b907499b58d939d42ac74316bb81311e2dc7f8a', '[\"*\"]', '2026-09-20 04:08:04', '2026-09-20 12:08:04', '2026-09-20 04:08:04', '2026-09-20 04:08:04'),
(71, 'App\\Models\\User', 1, 'semilla-session', '69125d3b8630565395a59b93d4c7924e2d3ecb1ce91f1df648cd0c7bd0036d44', '[\"*\"]', '2026-09-20 04:08:24', '2026-09-20 12:08:24', '2026-09-20 04:08:24', '2026-09-20 04:08:24'),
(72, 'App\\Models\\User', 1, 'semilla-session', '08f62d78c51fb722d5e8ad59a13ec5bac5710d3bb9ef8443aa052b77881d607e', '[\"*\"]', '2026-09-20 04:08:49', '2026-09-20 12:08:49', '2026-09-20 04:08:49', '2026-09-20 04:08:49'),
(73, 'App\\Models\\User', 1, 'semilla-session', 'aa693c6e1848d9486e01338dd61229bdb17f321c3ddbd8d47c0f4b73040abe4d', '[\"*\"]', '2026-09-20 04:13:00', '2026-09-20 12:13:00', '2026-09-20 04:13:00', '2026-09-20 04:13:00'),
(74, 'App\\Models\\User', 1, 'semilla-session', 'bb39c6e7b437c954b62a4e80c629c80ccc99fbb615d7dbf57c0c12b265cc3199', '[\"*\"]', '2026-09-20 04:21:33', '2026-09-20 12:21:33', '2026-09-20 04:21:33', '2026-09-20 04:21:33'),
(75, 'App\\Models\\User', 1, 'semilla-session', '922b2d864c283783c953e613c858d777aef728075cdf241a7668e2f408484d97', '[\"*\"]', '2026-09-20 04:24:52', '2026-09-20 12:24:51', '2026-09-20 04:24:51', '2026-09-20 04:24:52'),
(76, 'App\\Models\\User', 1, 'semilla-session', '7bf4fa6c73c3f3ac0142de00e46e09c6be283e6e94da3d95c2c7617467e89da3', '[\"*\"]', '2026-09-20 04:27:33', '2026-09-20 12:27:31', '2026-09-20 04:27:31', '2026-09-20 04:27:33'),
(77, 'App\\Models\\User', 1, 'semilla-session', 'bf979818e4a273cb3f8df314f3c47a59aaf6e22a4bee886596934a7ab5f14d6b', '[\"*\"]', '2026-09-20 04:27:35', '2026-09-20 12:27:35', '2026-09-20 04:27:35', '2026-09-20 04:27:35'),
(78, 'App\\Models\\User', 1, 'semilla-session', '63de0d08031a544f285ac00021218aa2062a4b472973093e7f1b3644e8a28091', '[\"*\"]', '2026-09-20 04:27:39', '2026-09-20 12:27:38', '2026-09-20 04:27:38', '2026-09-20 04:27:39'),
(79, 'App\\Models\\User', 1, 'semilla-session', '5268bb163ca5b2816ac15cb53c7f1cf390b6b17ab3680e4195548f6e8bd877ed', '[\"*\"]', '2026-09-20 04:27:42', '2026-09-20 12:27:42', '2026-09-20 04:27:42', '2026-09-20 04:27:42'),
(80, 'App\\Models\\User', 1, 'semilla-session', '7d05b8ff5bf80073d8fd9edc59d9aec3a8ebd9702656efde75c2ed2354af58f0', '[\"*\"]', '2026-09-20 04:27:49', '2026-09-20 12:27:49', '2026-09-20 04:27:49', '2026-09-20 04:27:49'),
(81, 'App\\Models\\User', 1, 'semilla-pin', '75ac7067f4135127aee2fabf2e047bffe182d8294a7c16731ea0708a0ea6a809', '[\"*\"]', '2026-09-20 04:27:52', '2026-09-20 08:27:52', '2026-09-20 04:27:52', '2026-09-20 04:27:52'),
(82, 'App\\Models\\User', 1, 'semilla-session', '70f60cdf49c13edaaefa6f31a639b28c22cda569451da483880dd747cd07b569', '[\"*\"]', '2026-09-20 04:27:58', '2026-09-20 12:27:55', '2026-09-20 04:27:55', '2026-09-20 04:27:58'),
(83, 'App\\Models\\User', 1, 'semilla-session', '26a3cd86e1ecddce2988805525d038d51b8d193c21a6815b7977c23ca382481b', '[\"*\"]', '2026-09-20 04:28:01', '2026-09-20 12:28:01', '2026-09-20 04:28:01', '2026-09-20 04:28:01'),
(84, 'App\\Models\\User', 1, 'semilla-session', 'ba38dd7d317f9eae2f00584323c5e658f5e8b9de8e34b45bbbd4a7ff742cb453', '[\"*\"]', '2026-09-20 04:28:13', '2026-09-20 12:28:10', '2026-09-20 04:28:10', '2026-09-20 04:28:13'),
(85, 'App\\Models\\User', 1, 'semilla-session', '171ff4ac96ceea3d3b156e2199bd9466ce67f57a0c7197a97c06cc585e600449', '[\"*\"]', '2026-09-20 09:33:42', '2026-09-20 17:31:44', '2026-09-20 09:31:44', '2026-09-20 09:33:42'),
(86, 'App\\Models\\User', 1, 'semilla-session', '0852c47c96a93a688c759bc61e709394d8af86b38646f959cb97a4311e1b4ece', '[\"*\"]', '2026-09-22 12:02:35', '2026-09-22 20:02:34', '2026-09-22 12:02:34', '2026-09-22 12:02:35'),
(87, 'App\\Models\\User', 1, 'semilla-session', 'a43a064981d76700f45f2c0e8326e03f6c53b935792ebefff412af309ae1c54a', '[\"*\"]', '2026-09-22 12:02:37', '2026-09-22 20:02:37', '2026-09-22 12:02:37', '2026-09-22 12:02:37'),
(88, 'App\\Models\\User', 1, 'semilla-session', '87728f75a305e2296b20e471bae764c3f01ecf235aaf4ceb63992048e65d511d', '[\"*\"]', '2026-09-22 12:02:39', '2026-09-22 20:02:39', '2026-09-22 12:02:39', '2026-09-22 12:02:39'),
(89, 'App\\Models\\User', 1, 'semilla-session', 'cc4bfca8317f3bd38a62722c36961d43ccd4104105d4422f365541c6244b4389', '[\"*\"]', '2026-09-22 12:02:42', '2026-09-22 20:02:41', '2026-09-22 12:02:41', '2026-09-22 12:02:42'),
(90, 'App\\Models\\User', 1, 'semilla-session', '8075b58b0d7a60f2db7e338186d3421ed55e40e37642614961f8f8a968ba935c', '[\"*\"]', '2026-09-22 12:02:46', '2026-09-22 20:02:46', '2026-09-22 12:02:46', '2026-09-22 12:02:46'),
(91, 'App\\Models\\User', 1, 'semilla-pin', '2c01fbc000c3fef2250a889e64ca2d47ad88643db9ff4cebee99af8ddd1fadeb', '[\"*\"]', '2026-09-22 12:02:48', '2026-09-22 16:02:48', '2026-09-22 12:02:48', '2026-09-22 12:02:48'),
(92, 'App\\Models\\User', 1, 'semilla-session', 'f3859536a11c86787529854bdf7d6b3c3d6b4f91c361e0847cce4ed5ac129074', '[\"*\"]', '2026-09-22 12:02:52', '2026-09-22 20:02:50', '2026-09-22 12:02:50', '2026-09-22 12:02:52'),
(93, 'App\\Models\\User', 1, 'semilla-session', '164dc0cf4b008cd5e2860abcec54e30fe62894f05e9118ec10497a552ff421c4', '[\"*\"]', '2026-09-22 12:02:54', '2026-09-22 20:02:54', '2026-09-22 12:02:54', '2026-09-22 12:02:54'),
(94, 'App\\Models\\User', 1, 'semilla-session', '7217ce05dae3701eea7fc90c84b867694b4c85b724f95a8943aed12727ab7971', '[\"*\"]', '2026-09-22 12:03:02', '2026-09-22 20:03:00', '2026-09-22 12:03:00', '2026-09-22 12:03:02'),
(96, 'App\\Models\\User', 1, 'semilla-session', '57d4528913814e65c68a0ed6fc1040a2e025b8618f8c88353d506fb4213edfa1', '[\"*\"]', '2026-09-23 03:40:20', '2026-09-23 11:33:19', '2026-09-23 03:33:19', '2026-09-23 03:40:20');

-- --------------------------------------------------------
-- Estructura de tabla para `reniec_cache`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `reniec_cache`;
CREATE TABLE `reniec_cache` (
  `dni` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json NOT NULL,
  `cached_at` timestamp NOT NULL,
  `expires_at` timestamp NOT NULL,
  PRIMARY KEY (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para `reniec_cache`
INSERT INTO `reniec_cache` VALUES ('02817462', '{\"sexo\": \"F\", \"source\": \"Padrón Comunal Cusco - Valle Sagrado\", \"nombres\": \"ROSA\", \"telefono\": \"951 842 103\", \"comunidad\": \"huayllabamba\", \"direccion\": \"Comunidad Huayllabamba\", \"apellidoMaterno\": \"QUISPE\", \"apellidoPaterno\": \"MAMANI\", \"fechaNacimiento\": \"1959-04-12\", \"ubigeoNacimiento\": \"080203\"}', '2026-09-20 04:24:52', '2026-10-20 04:24:52'),
('42918274', '{\"sexo\": \"M\", \"source\": \"Padrón Comunal Cusco - Valle Sagrado\", \"nombres\": \"JUAN\", \"telefono\": \"984 312 809\", \"comunidad\": \"rumichaca\", \"direccion\": \"Rumichaca Sector Alto\", \"apellidoMaterno\": \"CONDORI\", \"apellidoPaterno\": \"QUISPE\", \"fechaNacimiento\": \"1972-11-20\", \"ubigeoNacimiento\": \"080504\"}', '2026-09-20 04:24:52', '2026-10-20 04:24:52'),
('45892104', '{\"sexo\": \"M\", \"source\": \"Padrón Comunal Cusco - Valle Sagrado\", \"nombres\": \"SANTOS FAUSTINO\", \"telefono\": \"984 312 809\", \"comunidad\": \"rumichaca\", \"direccion\": \"Comunidad Rumichaca Sector Alto\", \"apellidoMaterno\": \"HUAMÁN\", \"apellidoPaterno\": \"QUISPE\", \"fechaNacimiento\": \"1968-08-14\", \"ubigeoNacimiento\": \"080101\"}', '2026-09-20 04:13:00', '2026-10-20 04:13:00'),
('45892109', '{\"sexo\": \"M\", \"source\": \"Padrón de Contingencia Rural\", \"nombres\": \"JOSÉ LUIS\", \"telefono\": \"984 092109\", \"comunidad\": \"rumichaca\", \"direccion\": \"Comunidad Campesina Valle Sagrado\", \"apellidoMaterno\": \"MAMANI\", \"apellidoPaterno\": \"ROCA\", \"fechaNacimiento\": \"1999-10-18\", \"ubigeoNacimiento\": \"080101\"}', '2026-09-20 09:33:07', '2026-10-20 09:33:07'),
('45892110', '{\"sexo\": \"F\", \"source\": \"Padrón de Contingencia Rural\", \"nombres\": \"DELIA\", \"telefono\": \"984 092110\", \"comunidad\": \"rumichaca\", \"direccion\": \"Comunidad Campesina Valle Sagrado\", \"apellidoMaterno\": \"FLORES\", \"apellidoPaterno\": \"QUISPE\", \"fechaNacimiento\": \"2000-11-19\", \"ubigeoNacimiento\": \"080101\"}', '2026-09-20 09:32:15', '2026-10-20 09:32:15'),
('45892222', '{\"sexo\": \"F\", \"source\": \"Padrón de Contingencia Rural\", \"nombres\": \"DELIA\", \"telefono\": \"984 092222\", \"comunidad\": \"rumichaca\", \"direccion\": \"Comunidad Campesina Valle Sagrado\", \"apellidoMaterno\": \"CHAMPI\", \"apellidoPaterno\": \"MAMANI\", \"fechaNacimiento\": \"1977-03-19\", \"ubigeoNacimiento\": \"080101\"}', '2026-09-20 09:33:32', '2026-10-20 09:33:32'),
('70891234', '{\"sexo\": \"F\", \"source\": \"Padrón de Contingencia Rural\", \"nombres\": \"HILDA\", \"telefono\": \"984 091234\", \"comunidad\": \"rumichaca\", \"direccion\": \"Comunidad Campesina Valle Sagrado\", \"apellidoMaterno\": \"CCORI\", \"apellidoPaterno\": \"CONDORI\", \"fechaNacimiento\": \"1979-11-11\", \"ubigeoNacimiento\": \"080101\"}', '2026-09-20 04:21:33', '2026-10-20 04:21:33');

-- --------------------------------------------------------
-- Estructura de tabla para `role_has_permissions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `role_has_permissions`;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Estructura de tabla para `roles`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `sessions`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `stations`
-- --------------------------------------------------------
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

-- Volcado de datos para `stations`
INSERT INTO `stations` VALUES (1, 1, 'ADM-01', 'admision', 'Mesa Admision 01', 'BT-POS-01', 1, '2026-09-18 10:48:31', '2026-09-18 10:48:31'),
(2, 1, 'TRI-02', 'triaje', 'Box Triaje B-02', NULL, 1, '2026-09-18 10:48:31', '2026-09-18 10:48:31'),
(3, 1, 'MED-01', 'medico', 'Consultorio 1', 'BT-POS-01', 1, '2026-09-18 10:48:31', '2026-09-18 10:48:31'),
(4, 1, 'PED-02', 'pediatria', 'Consultorio 2 - Pediatria', NULL, 1, '2026-09-18 10:48:31', '2026-09-18 10:48:31');

-- --------------------------------------------------------
-- Estructura de tabla para `sync_logs`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `system_settings`
-- --------------------------------------------------------
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para `system_settings`
INSERT INTO `system_settings` VALUES (1, 'audit_module_enabled', 'true', 'general', NULL, '2026-09-23 03:53:40', '2026-09-23 03:53:40');

-- --------------------------------------------------------
-- Estructura de tabla para `tickets_termicos`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `triajes`
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- Estructura de tabla para `users`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cmp_code` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `especialidad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dni` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'voluntario',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verification_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_verification_expires_at` timestamp NULL DEFAULT NULL,
  `email_verification_attempts` tinyint unsigned NOT NULL DEFAULT '0',
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

-- Volcado de datos para `users`
INSERT INTO `users` VALUES (1, 'ADMIN-001', NULL, NULL, NULL, 'Administrador', 'Semilla', 'admin', 'admin@semilla.pe', NULL, NULL, 0, NULL, '$2y$12$JDhVT.eu3gHv53V1ayDa8e/TUROR1IWFq1enQQW5Krj/sdE0q85K6', '$2y$12$QZ4ETsTI26Qm.LiAMPQew.bQ.lnbFlp2HXzSENjHQRNJGy1aOaAla', NULL, NULL, NULL, 1, '2026-09-23 03:33:19', NULL, '2026-09-18 10:48:31', '2026-09-23 03:33:19'),
(2, 'CMP-89241', NULL, '45892104', NULL, 'Marco', 'Huaman Quispe', 'medico', 'mhuaman@semilla.pe', NULL, NULL, 0, NULL, '$2y$12$y2/9Cw9DN/6nYZFpxMlXp.EQmiPhnFqDHxp28PytZjIXRUi4f0qqu', '$2y$12$GbNKdDSPuJBbO7HvZuJxJeYsB4afSjdZcrytTzKovIlRB9b.8Y33q', NULL, NULL, 'MED-01', 1, NULL, NULL, '2026-09-18 10:48:31', '2026-09-19 01:17:37'),
(3, 'CMP-92017', NULL, NULL, NULL, 'Sofia', 'Benavides Roca', 'triaje', 'sbenavides@semilla.pe', NULL, NULL, 0, NULL, '$2y$12$1FO7sOmF505YIza.ZifqduP8X1WmqmJj76u8h8rJw/ecYtpCI8WY2', '$2y$12$A61qEaE3hsyM1p1tcoFh7uK7wPpWEaHEKf6fW09bqc8ftxzGVdoze', NULL, NULL, 'TRI-02', 1, NULL, NULL, '2026-09-18 10:48:31', '2026-09-19 01:17:37'),
(4, NULL, NULL, NULL, NULL, 'Ana', 'Torres Mamani', 'admision', 'atorres@semilla.pe', NULL, NULL, 0, NULL, '$2y$12$3M8rc6ZQa1FGQQKbvVcY/ec/Bp/M6VQClOdEfMLd63MfC2wXt/cri', NULL, NULL, NULL, 'ADM-01', 1, NULL, NULL, '2026-09-18 10:48:31', '2026-09-19 01:17:37');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
-- Fin del volcado de triaje_semilla
