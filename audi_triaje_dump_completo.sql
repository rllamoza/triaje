-- ========================================================
-- ElRond - Sistema de Gestión Médica
-- Volcado de Base de Datos de Auditoría Forense y Telemetría
-- Base de datos: audi_triaje
-- Fecha de generación: 2026-09-27 03:44:04
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = '+00:00';
SET NAMES utf8mb4;

-- --------------------------------------------------------
-- Estructura de tabla para `audit_records`
-- --------------------------------------------------------
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
  `duration_ms` double DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_local_ip` tinyint(1) NOT NULL DEFAULT '0',
  `hostname` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `network_effective_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `network_rtt_ms` int DEFAULT NULL,
  `network_downlink_mbps` double DEFAULT NULL,
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
  KEY `audit_records_user_role_index` (`user_role`),
  KEY `audit_records_user_dni_index` (`user_dni`),
  KEY `audit_records_method_index` (`method`),
  KEY `audit_records_endpoint_index` (`endpoint`),
  KEY `audit_records_action_category_index` (`action_category`),
  KEY `audit_records_status_code_index` (`status_code`),
  KEY `audit_records_ip_address_index` (`ip_address`),
  KEY `audit_records_is_local_ip_index` (`is_local_ip`),
  KEY `audit_records_created_at_index` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcado de datos para `audit_records`
INSERT INTO `audit_records` VALUES (1, 1, 'Administrador Semilla', 'admin@semilla.pe', 'admin', NULL, NULL, 'POST', 'http://127.0.0.1:8000/api/beneficiarios', '/api/beneficiarios', NULL, 'ADMISION', 422, 11.44, '127.0.0.1', 1, 'checkhost.local', NULL, NULL, NULL, 0, 'Desktop', 'Windows 10/11', 'Chrome 151', NULL, NULL, 'es-ES,es;q=0.9,en;q=0.8,fr;q=0.7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0', '{\"dni\": \"45892104\", \"sexo\": \"M\", \"nombres\": \"SANTOS FAUSTINO\", \"alergias\": \"Alérgico a Penicilina (choque anafiláctico hace 8 años)\", \"telefono\": \"984 312 809\", \"apellidos\": \"QUISPE HUAMÁN\", \"comunidad\": \"rumichaca\", \"tipo_seguro\": \"sis\", \"antecedentes\": \"Hipertensión\", \"fecha_nacimiento\": \"1968-08-14\"}', NULL, 'The campaign id field is required.', '2026-09-23 03:40:20', '2026-09-23 03:40:20'),
(2, NULL, NULL, NULL, NULL, NULL, NULL, 'POST', 'http://localhost/api/triajes', '/api/triajes', NULL, 'TRIAJE', 201, 0.05, '127.0.0.1', 1, 'checkhost.local', '4g', 24, 18.5, 0, 'Desktop', 'Windows 10/11', 'Chrome 124', '1920x1080', 'America/Lima', 'es-PE', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', '{\"pin\": \"***REDACTED***\", \"password\": \"***REDACTED***\", \"paciente_id\": 4501, \"presion_arterial\": \"120/80\", \"frecuencia_cardiaca\": 74}', '{\"message\": \"Signos vitales de triaje registrados exitosamente\", \"success\": true, \"data_count\": 1}', NULL, '2026-09-23 03:53:09', '2026-09-23 03:53:09'),
(3, NULL, NULL, NULL, NULL, NULL, NULL, 'POST', 'http://localhost/api/triajes', '/api/triajes', NULL, 'TRIAJE', 200, 0.01, '127.0.0.1', 1, 'checkhost.local', NULL, NULL, NULL, 0, 'Desktop', 'Desconocido', 'Desconocido', NULL, NULL, 'en-us,en;q=0.5', 'Symfony', '{\"test\": \"debe_ignorarse\"}', NULL, NULL, '2026-09-23 03:53:40', '2026-09-23 03:53:40'),
(4, NULL, NULL, NULL, NULL, NULL, NULL, 'GET', 'http://127.0.0.1:8000/api/campaigns', '/api/campaigns', NULL, 'CAMPANIA', 401, 74.1, '127.0.0.1', 1, 'checkhost.local', '4g', 250, 10, 0, 'Desktop', 'Windows 10/11', 'Chrome 151', '1920x1080', 'America/Lima', 'es-ES', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0', NULL, NULL, 'Unauthenticated.', '2026-09-26 21:14:47', '2026-09-26 21:14:47'),
(5, NULL, NULL, NULL, NULL, NULL, NULL, 'GET', 'http://127.0.0.1:8000/api/campaigns', '/api/campaigns', NULL, 'CAMPANIA', 401, 2.47, '127.0.0.1', 1, 'checkhost.local', '4g', 250, 10, 0, 'Desktop', 'Windows 10/11', 'Chrome 151', '1920x1080', 'America/Lima', 'es-ES', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 OPR/135.0.0.0', NULL, NULL, 'Unauthenticated.', '2026-09-26 21:14:48', '2026-09-26 21:14:48');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
-- Fin del volcado de audi_triaje
