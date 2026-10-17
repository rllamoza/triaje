-- ==============================================================================
-- SEMILLA TRIAJE - DATOS SINTÉTICOS DE SIMULACIÓN CLÍNICA (30 PACIENTES)
-- Contexto: Campaña Valle Sagrado (Urubamba - Cusco, 2870 msnm)
-- Distribución requerida:
--   1) 10 Pacientes Registrados (en espera de triaje, con ticket asignado)
--   2) 10 Pacientes Triados (en cola de espera médica, con signos vitales y prioridad)
--   3) 10 Pacientes Atendidos (finalizados, con diagnóstico CIE-10 y receta médica completa)
-- ==============================================================================

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

-- ------------------------------------------------------------------------------
-- 0. PRERREQUISITOS: Asegurar que existan la Campaña (ID 1) y los Usuarios del Sistema
-- ------------------------------------------------------------------------------
INSERT INTO `campaigns` (`id`, `code`, `name`, `location_name`, `province`, `department`, `altitude_masl`, `start_date`, `status`, `created_at`, `updated_at`) VALUES
(1, 'CMP-2025-CUS-02', 'Cusco - Valle Sagrado 2025', 'Salon Comunal Rumichaca', 'Urubamba', 'Cusco', 2870, '2025-04-01', 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `status` = 'active';

INSERT INTO `users` (`id`, `cmp_code`, `dni`, `name`, `apellidos`, `role`, `email`, `password`, `station_default`, `active`, `created_at`, `updated_at`) VALUES
(1, 'ADMIN-001', '00000001', 'Administrador', 'Semilla', 'admin', 'admin@semilla.pe', '$2y$12$lV4sMIvK1zUTOF0PaM1jJOkOtAw/8w91WSRwrxc039sarC3/lDpw6', NULL, 1, NOW(), NOW()),
(2, 'CMP-89241', '45892104', 'Marco', 'Huaman Quispe', 'medico', 'mhuaman@semilla.pe', '$2y$12$EOf/ZKprf7NuupvyU6p69.71mv.rthC8LritBiAJohTrWeLJY1jNm', 'MED-01', 1, NOW(), NOW()),
(3, 'CMP-92017', '43920178', 'Sofia', 'Benavides Roca', 'triaje', 'sbenavides@semilla.pe', '$2y$12$4Sxeahn4uZ96H2XeBOpQXeYbft/.McXSVvLSYXzsrBzUQ2J2Iido6', 'TRI-02', 1, NOW(), NOW()),
(4, NULL, '47291048', 'Ana', 'Torres Mamani', 'admision', 'atorres@semilla.pe', '$2y$12$J78sTlmtqEscfKDc8ITz/.7srk.9Hl9MyF42KQ/4bn30dUf5r.Vmi', 'ADM-01', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE `active` = 1;

-- ------------------------------------------------------------------------------
-- 1. BENEFICIARIOS (30 Personas con DNIs, nombres y comunidades del Valle Sagrado)
-- ------------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

-- Grupo 1: 10 Registrados (esperando triaje)
INSERT INTO `beneficiarios` (`id`, `dni`, `nombres`, `apellidos`, `fecha_nacimiento`, `edad_calculada`, `sexo`, `estado_civil`, `idioma_principal`, `grado_instruccion`, `ocupacion`, `region`, `provincia`, `distrito`, `comunidad`, `direccion_libre`, `altitud_residencia`, `tipo_seguro`, `numero_afiliacion`, `celular`, `grupo_sanguineo`, `rh_factor`, `peso_kg`, `talla_cm`, `reniec_verified`, `registered_by`, `campaign_id`, `created_at`, `updated_at`) VALUES
(101, '45291840', 'Sonia', 'Quispe Mamani', '1992-06-14', 33, 'F', 'conviviente', 'quechua', 'Secundaria completa', 'Agricultora', 'Cusco', 'Urubamba', 'Urubamba', 'Rumichaca', 'Sector Huayllabamba s/n', 2870, 'SIS', 'SIS-45291840', '984123001', 'O', '+', 58.50, 152.0, 1, 4, 1, NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 15 MINUTE),
(102, '23984102', 'Lucio', 'Condori Huamán', '1961-09-22', 64, 'M', 'casado', 'quechua', 'Primaria incompleta', 'Agricultor de maíz', 'Cusco', 'Urubamba', 'Ollantaytambo', 'Huilloc', 'Comunidad Alta s/n', 3450, 'SIS', 'SIS-23984102', '984123002', 'O', '+', 64.00, 160.0, 1, 4, 1, NOW() - INTERVAL 18 MINUTE, NOW() - INTERVAL 18 MINUTE),
(103, '74128956', 'Rosa Luz', 'Mayta Ccori', '2001-03-08', 24, 'F', 'soltero', 'espanol', 'Superior técnica', 'Artesana textil', 'Cusco', 'Urubamba', 'Chinchero', 'Cuper', 'Calle Principal 104', 3760, 'SIS', 'SIS-74128956', '984123003', 'A', '+', 52.00, 150.0, 1, 4, 1, NOW() - INTERVAL 22 MINUTE, NOW() - INTERVAL 22 MINUTE),
(104, '80234190', 'Mateo', 'Tupac Yupanqui Champi', '2019-11-05', 6, 'M', 'soltero', 'espanol', 'Inicial', 'Estudiante', 'Cusco', 'Urubamba', 'Maras', 'Pachar', 'Av. Vilcanota s/n', 2900, 'SIS', 'SIS-80234190', '984123004', 'O', '+', 20.50, 112.0, 1, 4, 1, NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 25 MINUTE),
(105, '10485923', 'Fortunata', 'Paucar vda. de Sallo', '1952-12-01', 73, 'F', 'viudo', 'quechua', 'Sin instrucción', 'Pastora', 'Cusco', 'Calca', 'Pisac', 'Amucavida', 'Sector Cuyo Grande', 3200, 'SIS', 'SIS-10485923', '984123005', 'B', '+', 49.00, 145.0, 1, 4, 1, NOW() - INTERVAL 28 MINUTE, NOW() - INTERVAL 28 MINUTE),
(106, '41908234', 'Bernardino', 'Huaraca Chille', '1983-05-19', 42, 'M', 'casado', 'quechua', 'Secundaria incompleta', 'Albañil', 'Cusco', 'Urubamba', 'Urubamba', 'Palcaraqui', 'Jr. Las Flores 302', 2870, 'ninguno', NULL, '984123006', 'O', '+', 71.00, 165.0, 1, 4, 1, NOW() - INTERVAL 32 MINUTE, NOW() - INTERVAL 32 MINUTE),
(107, '72349102', 'Yessica', 'Ccana Puma', '1998-08-30', 27, 'F', 'conviviente', 'espanol', 'Secundaria completa', 'Comerciante', 'Cusco', 'Urubamba', 'Yucay', 'San Juan', 'Calle Tahuantinsuyo 45', 2930, 'SIS', 'SIS-72349102', '984123007', 'O', '+', 60.00, 154.0, 1, 4, 1, NOW() - INTERVAL 35 MINUTE, NOW() - INTERVAL 35 MINUTE),
(108, '81029384', 'Thiago André', 'Sallo Cahuana', '2021-04-12', 4, 'M', 'soltero', 'espanol', 'Inicial', 'Hijo', 'Cusco', 'Urubamba', 'Urubamba', 'Rumichaca', 'Mz. D Lote 4', 2870, 'SIS', 'SIS-81029384', '984123008', 'O', '+', 16.20, 98.0, 1, 4, 1, NOW() - INTERVAL 40 MINUTE, NOW() - INTERVAL 40 MINUTE),
(109, '24019283', 'Néstor', 'Illapuma Huillca', '1970-01-15', 56, 'M', 'casado', 'quechua', 'Primaria completa', 'Agricultor', 'Cusco', 'Urubamba', 'Maras', 'Maras Pueblo', 'Calle Chichubamba 12', 3380, 'SIS', 'SIS-24019283', '984123009', 'A', '+', 68.00, 162.0, 1, 4, 1, NOW() - INTERVAL 42 MINUTE, NOW() - INTERVAL 42 MINUTE),
(110, '46892014', 'Gladys', 'Choqueccahua Nina', '1990-10-24', 35, 'F', 'soltero', 'espanol', 'Superior pedagógica', 'Docente rural', 'Cusco', 'Calca', 'Calca', 'Arin', 'Av. San Martín 204', 2920, 'ESSALUD', 'ESS-46892014', '984123010', 'O', '+', 57.00, 156.0, 1, 4, 1, NOW() - INTERVAL 45 MINUTE, NOW() - INTERVAL 45 MINUTE),

-- Grupo 2: 10 Triados (en cola médica con signos vitales evaluados)
(111, '43109284', 'Vicente', 'Mendoza Huallpa', '1985-02-17', 41, 'M', 'casado', 'quechua', 'Secundaria completa', 'Guía de turismo local', 'Cusco', 'Urubamba', 'Ollantaytambo', 'Piscacucho', 'Km 82 Camino Inca', 2700, 'SIS', 'SIS-43109284', '984123011', 'O', '+', 74.00, 168.0, 1, 4, 1, NOW() - INTERVAL 80 MINUTE, NOW() - INTERVAL 80 MINUTE),
(112, '10928347', 'Saturnina', 'Quispe de Huamán', '1948-06-04', 77, 'F', 'casado', 'quechua', 'Sin instrucción', 'Labores del hogar', 'Cusco', 'Urubamba', 'Urubamba', 'Media Luna', 'Sector Huaytampo s/n', 2870, 'SIS', 'SIS-10928347', '984123012', 'O', '+', 51.00, 142.0, 1, 4, 1, NOW() - INTERVAL 85 MINUTE, NOW() - INTERVAL 85 MINUTE),
(113, '76892301', 'Brayan Alex', 'Ccoyori Huanca', '2004-11-19', 21, 'M', 'soltero', 'espanol', 'Secundaria completa', 'Estudiante', 'Cusco', 'Urubamba', 'Chinchero', 'Umasbamba', 'Sector Huila Huila', 3780, 'SIS', 'SIS-76892301', '984123013', 'A', '+', 62.00, 166.0, 1, 4, 1, NOW() - INTERVAL 88 MINUTE, NOW() - INTERVAL 88 MINUTE),
(114, '82910485', 'Camila Valentina', 'Tito Ccorimanya', '2022-08-14', 3, 'F', 'soltero', 'espanol', 'Menor', 'Hija', 'Cusco', 'Urubamba', 'Urubamba', 'Rumichaca', 'Calle Pumacahua 15', 2870, 'SIS', 'SIS-82910485', '984123014', 'O', '+', 14.50, 92.0, 1, 4, 1, NOW() - INTERVAL 92 MINUTE, NOW() - INTERVAL 92 MINUTE),
(115, '24892019', 'Eusebio', 'Kanchi Quispe', '1967-12-16', 58, 'M', 'casado', 'quechua', 'Primaria incompleta', 'Cantero / Albañil', 'Cusco', 'Urubamba', 'Maras', 'Mahuaypampa', 'Sector Cruzpata s/n', 3420, 'SIS', 'SIS-24892019', '984123015', 'B', '+', 69.50, 161.0, 1, 4, 1, NOW() - INTERVAL 95 MINUTE, NOW() - INTERVAL 95 MINUTE),
(116, '44910283', 'Mariluz', 'Pauccar Ccolque', '1988-04-03', 38, 'F', 'conviviente', 'quechua', 'Secundaria completa', 'Cocina en restaurante', 'Cusco', 'Urubamba', 'Yucay', 'Yucay Centro', 'Calle San Bernardo 12', 2930, 'SIS', 'SIS-44910283', '984123016', 'O', '+', 63.00, 153.0, 1, 4, 1, NOW() - INTERVAL 100 MINUTE, NOW() - INTERVAL 100 MINUTE),
(117, '23891048', 'Toribio', 'Puma Champi', '1959-04-27', 66, 'M', 'casado', 'quechua', 'Primaria incompleta', 'Agricultor', 'Cusco', 'Calca', 'Pisac', 'Taray', 'Calle Arequipa 56', 2970, 'SIS', 'SIS-23891048', '984123017', 'O', '+', 61.00, 158.0, 1, 4, 1, NOW() - INTERVAL 105 MINUTE, NOW() - INTERVAL 105 MINUTE),
(118, '75910284', 'Flor de María', 'Lloclla Huamán', '2000-09-12', 25, 'F', 'soltero', 'espanol', 'Superior no universitaria', 'Guía de turismo', 'Cusco', 'Urubamba', 'Ollantaytambo', 'Ollantaytambo Pueblo', 'Calle del Medio s/n', 2792, 'ninguno', NULL, '984123018', 'A', '+', 54.00, 157.0, 1, 4, 1, NOW() - INTERVAL 110 MINUTE, NOW() - INTERVAL 110 MINUTE),
(119, '47820193', 'Raúl Hernán', 'Huamantinco Roca', '1993-01-29', 33, 'M', 'soltero', 'espanol', 'Secundaria completa', 'Conductor de mototaxi', 'Cusco', 'Urubamba', 'Urubamba', 'Pintacha', 'Av. Ferrocarril 88', 2870, 'SIS', 'SIS-47820193', '984123019', 'O', '+', 77.00, 170.0, 1, 4, 1, NOW() - INTERVAL 115 MINUTE, NOW() - INTERVAL 115 MINUTE),
(120, '10492810', 'Justina', 'Tupa de Ccori', '1945-08-10', 81, 'F', 'viudo', 'quechua', 'Sin instrucción', 'Labores del hogar', 'Cusco', 'Urubamba', 'Maras', 'Chequerec', 'Comunidad Chequerec', 3500, 'SIS', 'SIS-10492810', '984123020', 'O', '+', 46.00, 140.0, 1, 4, 1, NOW() - INTERVAL 120 MINUTE, NOW() - INTERVAL 120 MINUTE),

-- Grupo 3: 10 Atendidos (con consulta finalizada y receta médica emitida)
(121, '42918274', 'Rosa', 'Mamani Quispe', '1959-05-12', 66, 'F', 'casado', 'quechua', 'Primaria incompleta', 'Comerciante de flores', 'Cusco', 'Urubamba', 'Urubamba', 'Rumichaca', 'Sector Huayllabamba s/n', 2870, 'SIS', 'SIS-42918274', '984123021', 'O', '+', 66.50, 151.0, 1, 4, 1, NOW() - INTERVAL 240 MINUTE, NOW() - INTERVAL 240 MINUTE),
(122, '78291043', 'Dylan Gael', 'Huallpa Ccori', '2022-07-15', 3, 'M', 'soltero', 'espanol', 'Menor', 'Hijo', 'Cusco', 'Urubamba', 'Ollantaytambo', 'Huilloc', 'Comunidad Huilloc s/n', 3450, 'SIS', 'SIS-78291043', '984123022', 'O', '+', 13.80, 91.0, 1, 4, 1, NOW() - INTERVAL 245 MINUTE, NOW() - INTERVAL 245 MINUTE),
(123, '23910294', 'Policarpio', 'Condori Huamán', '1963-01-26', 63, 'M', 'casado', 'quechua', 'Primaria completa', 'Agricultor', 'Cusco', 'Urubamba', 'Chinchero', 'Pongobamba', 'Camino Real 44', 3750, 'SIS', 'SIS-23910294', '984123023', 'O', '+', 65.00, 162.0, 1, 4, 1, NOW() - INTERVAL 250 MINUTE, NOW() - INTERVAL 250 MINUTE),
(124, '45910283', 'Guillermina', 'Tupayachi Mayta', '1989-11-03', 36, 'F', 'conviviente', 'espanol', 'Secundaria completa', 'Cocina', 'Cusco', 'Urubamba', 'Maras', 'Maras Pueblo', 'Calle Grau 12', 3380, 'SIS', 'SIS-45910283', '984123024', 'A', '+', 59.00, 155.0, 1, 4, 1, NOW() - INTERVAL 255 MINUTE, NOW() - INTERVAL 255 MINUTE),
(125, '10829104', 'Demetrio', 'Champi Paucar', '1951-03-18', 75, 'M', 'viudo', 'quechua', 'Sin instrucción', 'Pastoreo', 'Cusco', 'Calca', 'Pisac', 'Cuyo Grande', 'Sector Alto s/n', 3350, 'SIS', 'SIS-10829104', '984123025', 'B', '+', 58.00, 156.0, 1, 4, 1, NOW() - INTERVAL 260 MINUTE, NOW() - INTERVAL 260 MINUTE),
(126, '41029384', 'Nancy', 'Huaraca Chille', '1984-08-22', 41, 'F', 'casado', 'quechua', 'Secundaria completa', 'Artesana', 'Cusco', 'Urubamba', 'Urubamba', 'Palcaraqui', 'Jr. Bolívar 105', 2870, 'SIS', 'SIS-41029384', '984123026', 'O', '+', 62.00, 153.0, 1, 4, 1, NOW() - INTERVAL 265 MINUTE, NOW() - INTERVAL 265 MINUTE),
(127, '74820193', 'Kevin Arnold', 'Ccana Puma', '2002-12-09', 23, 'M', 'soltero', 'espanol', 'Superior técnica', 'Mecánico', 'Cusco', 'Urubamba', 'Yucay', 'San Juan', 'Av. Los Incas 77', 2930, 'ninguno', NULL, '984123027', 'O', '+', 70.00, 169.0, 1, 4, 1, NOW() - INTERVAL 270 MINUTE, NOW() - INTERVAL 270 MINUTE),
(128, '46910284', 'Hilda Victoria', 'Sallo Cahuana', '1991-04-16', 35, 'F', 'conviviente', 'espanol', 'Secundaria completa', 'Ama de casa', 'Cusco', 'Urubamba', 'Urubamba', 'Rumichaca', 'Mz. D Lote 4', 2870, 'SIS', 'SIS-46910284', '984123028', 'O', '+', 56.00, 152.0, 1, 4, 1, NOW() - INTERVAL 275 MINUTE, NOW() - INTERVAL 275 MINUTE),
(129, '24910283', 'Casimiro', 'Illapuma Huillca', '1968-07-07', 57, 'M', 'casado', 'quechua', 'Primaria incompleta', 'Agricultor', 'Cusco', 'Urubamba', 'Maras', 'Pachar', 'Calle Comercio 34', 2900, 'SIS', 'SIS-24910283', '984123029', 'O', '+', 67.00, 163.0, 1, 4, 1, NOW() - INTERVAL 280 MINUTE, NOW() - INTERVAL 280 MINUTE),
(130, '47102938', 'Yanet', 'Choqueccahua Nina', '1994-09-02', 31, 'F', 'soltero', 'espanol', 'Superior universitaria', 'Enfermera técnica', 'Cusco', 'Calca', 'Calca', 'Calca Cercado', 'Calle Espinar 401', 2920, 'ESSALUD', 'ESS-47102938', '984123030', 'A', '+', 55.00, 157.0, 1, 4, 1, NOW() - INTERVAL 285 MINUTE, NOW() - INTERVAL 285 MINUTE)
ON DUPLICATE KEY UPDATE
  `dni` = VALUES(`dni`),
  `nombres` = VALUES(`nombres`),
  `apellidos` = VALUES(`apellidos`),
  `fecha_nacimiento` = VALUES(`fecha_nacimiento`),
  `edad_calculada` = VALUES(`edad_calculada`),
  `sexo` = VALUES(`sexo`),
  `comunidad` = VALUES(`comunidad`),
  `tipo_seguro` = VALUES(`tipo_seguro`),
  `celular` = VALUES(`celular`),
  `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 2. ATENCIONES (30 Atenciones con sus Tickets Correlativos y Estados Clínicos)
-- ------------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

-- Grupo 1 (IDs 101 a 110): REGISTRADOS - STATUS 'en_espera_triaje'
INSERT INTO `atenciones` (`id`, `ticket_number`, `ticket_codigo`, `specialty_code`, `specialty_name`, `consultorio`, `beneficiario_id`, `campaign_id`, `station_id`, `arrival_time`, `status`, `seguro_usado`, `triage_start_at`, `triage_end_at`, `medico_start_at`, `medico_end_at`, `admitted_by`, `medico_id`, `notes`, `created_at`, `updated_at`) VALUES
(101, 1, 'MED-0001', 'MED', 'Medicina General', 'Consultorio 01', 101, 1, NULL, NOW() - INTERVAL 15 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, 2, 'Paciente refiere malestar general y dolor de cabeza', NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 15 MINUTE),
(102, 2, 'MED-0002', 'MED', 'Medicina General', 'Consultorio 01', 102, 1, NULL, NOW() - INTERVAL 18 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, 2, 'Dolor articular crónico en rodillas y caderas', NOW() - INTERVAL 18 MINUTE, NOW() - INTERVAL 18 MINUTE),
(103, 3, 'GIN-0001', 'GIN', 'Ginecología', 'Tópico Ginec.', 103, 1, NULL, NOW() - INTERVAL 22 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, NULL, 'Control ginecológico preventivo y descarte', NOW() - INTERVAL 22 MINUTE, NOW() - INTERVAL 22 MINUTE),
(104, 4, 'PED-0001', 'PED', 'Pediatría', 'Consultorio 02', 104, 1, NULL, NOW() - INTERVAL 25 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, 2, 'Fiebre de 2 días y tos seca nocturna', NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 25 MINUTE),
(105, 5, 'OFT-0001', 'OFT', 'Oftalmología', 'Módulo Visual', 105, 1, NULL, NOW() - INTERVAL 28 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, NULL, 'Disminución progresiva de agudeza visual ojo izquierdo', NOW() - INTERVAL 28 MINUTE, NOW() - INTERVAL 28 MINUTE),
(106, 6, 'ODO-0001', 'ODO', 'Odontología', 'Box Dental', 106, 1, NULL, NOW() - INTERVAL 32 MINUTE, 'en_espera_triaje', 'ninguno', NULL, NULL, NULL, NULL, 4, NULL, 'Dolor dental molar inferior derecho al masticar', NOW() - INTERVAL 32 MINUTE, NOW() - INTERVAL 32 MINUTE),
(107, 7, 'MED-0003', 'MED', 'Medicina General', 'Consultorio 01', 107, 1, NULL, NOW() - INTERVAL 35 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, 2, 'Sensación de ardor estomacal y reflujo', NOW() - INTERVAL 35 MINUTE, NOW() - INTERVAL 35 MINUTE),
(108, 8, 'PED-0002', 'PED', 'Pediatría', 'Consultorio 02', 108, 1, NULL, NOW() - INTERVAL 40 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, 2, 'Evaluación de crecimiento, inapetencia y diarrea leve', NOW() - INTERVAL 40 MINUTE, NOW() - INTERVAL 40 MINUTE),
(109, 9, 'MED-0004', 'MED', 'Medicina General', 'Consultorio 01', 109, 1, NULL, NOW() - INTERVAL 42 MINUTE, 'en_espera_triaje', 'SIS', NULL, NULL, NULL, NULL, 4, 2, 'Lumbago posterior a esfuerzo físico de cosecha', NOW() - INTERVAL 42 MINUTE, NOW() - INTERVAL 42 MINUTE),
(110, 10, 'GIN-0002', 'GIN', 'Ginecología', 'Tópico Ginec.', 110, 1, NULL, NOW() - INTERVAL 45 MINUTE, 'en_espera_triaje', 'ESSALUD', NULL, NULL, NULL, NULL, 4, NULL, 'Dolor pélvico intermitente y dismenorrea', NOW() - INTERVAL 45 MINUTE, NOW() - INTERVAL 45 MINUTE),

-- Grupo 2 (IDs 111 a 120): TRIADOS - STATUS 'en_espera_medico'
(111, 11, 'MED-0005', 'MED', 'Medicina General', 'Consultorio 01', 111, 1, NULL, NOW() - INTERVAL 80 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 60 MINUTE, NOW() - INTERVAL 50 MINUTE, NULL, NULL, 4, 2, 'Triaje completado. Cefalea frontal y mareos.', NOW() - INTERVAL 80 MINUTE, NOW() - INTERVAL 50 MINUTE),
(112, 12, 'MED-0006', 'MED', 'Medicina General', 'Consultorio 01', 112, 1, NULL, NOW() - INTERVAL 85 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 65 MINUTE, NOW() - INTERVAL 55 MINUTE, NULL, NULL, 4, 2, 'Triaje completado. Crisis hipertensiva moderada.', NOW() - INTERVAL 85 MINUTE, NOW() - INTERVAL 55 MINUTE),
(113, 13, 'MED-0007', 'MED', 'Medicina General', 'Consultorio 01', 113, 1, NULL, NOW() - INTERVAL 88 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 70 MINUTE, NOW() - INTERVAL 58 MINUTE, NULL, NULL, 4, 2, 'Triaje completado. Dolor lumbar agudo incapacitante.', NOW() - INTERVAL 88 MINUTE, NOW() - INTERVAL 58 MINUTE),
(114, 14, 'PED-0003', 'PED', 'Pediatría', 'Consultorio 02', 114, 1, NULL, NOW() - INTERVAL 92 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 75 MINUTE, NOW() - INTERVAL 62 MINUTE, NULL, NULL, 4, 2, 'Triaje completado. Cuadro catarral con tiraje subcostal leve.', NOW() - INTERVAL 92 MINUTE, NOW() - INTERVAL 62 MINUTE),
(115, 15, 'MED-0008', 'MED', 'Medicina General', 'Consultorio 01', 115, 1, NULL, NOW() - INTERVAL 95 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 80 MINUTE, NOW() - INTERVAL 68 MINUTE, NULL, NULL, 4, 2, 'Triaje completado. Artralgia de rodillas y rigidez matutina.', NOW() - INTERVAL 95 MINUTE, NOW() - INTERVAL 68 MINUTE),
(116, 16, 'GIN-0003', 'GIN', 'Ginecología', 'Tópico Ginec.', 116, 1, NULL, NOW() - INTERVAL 100 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 82 MINUTE, NOW() - INTERVAL 70 MINUTE, NULL, NULL, 4, NULL, 'Triaje completado. Flujo vaginal y prurito.', NOW() - INTERVAL 100 MINUTE, NOW() - INTERVAL 70 MINUTE),
(117, 17, 'OFT-0002', 'OFT', 'Oftalmología', 'Módulo Visual', 117, 1, NULL, NOW() - INTERVAL 105 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 85 MINUTE, NOW() - INTERVAL 74 MINUTE, NULL, NULL, 4, NULL, 'Triaje completado. Ojo rojo bilateral y epífora.', NOW() - INTERVAL 105 MINUTE, NOW() - INTERVAL 74 MINUTE),
(118, 18, 'ODO-0002', 'ODO', 'Odontología', 'Box Dental', 118, 1, NULL, NOW() - INTERVAL 110 MINUTE, 'en_espera_medico', 'ninguno', NOW() - INTERVAL 90 MINUTE, NOW() - INTERVAL 78 MINUTE, NULL, NULL, 4, NULL, 'Triaje completado. Pulpitis reversible en pieza 1.6.', NOW() - INTERVAL 110 MINUTE, NOW() - INTERVAL 78 MINUTE),
(119, 19, 'MED-0009', 'MED', 'Medicina General', 'Consultorio 01', 119, 1, NULL, NOW() - INTERVAL 115 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 92 MINUTE, NOW() - INTERVAL 82 MINUTE, NULL, NULL, 4, 2, 'Triaje completado. Dolor epigástrico y náuseas.', NOW() - INTERVAL 115 MINUTE, NOW() - INTERVAL 82 MINUTE),
(120, 20, 'MED-0010', 'MED', 'Medicina General', 'Consultorio 01', 120, 1, NULL, NOW() - INTERVAL 120 MINUTE, 'en_espera_medico', 'SIS', NOW() - INTERVAL 98 MINUTE, NOW() - INTERVAL 88 MINUTE, NULL, NULL, 4, 2, 'Triaje completado. Adulta mayor con mareos y tos crónica.', NOW() - INTERVAL 120 MINUTE, NOW() - INTERVAL 88 MINUTE),

-- Grupo 3 (IDs 121 a 130): ATENDIDOS Y RECETADOS - STATUS 'finalizado'
(121, 21, 'MED-0011', 'MED', 'Medicina General', 'Consultorio 01', 121, 1, NULL, NOW() - INTERVAL 240 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 210 MINUTE, NOW() - INTERVAL 195 MINUTE, NOW() - INTERVAL 180 MINUTE, NOW() - INTERVAL 150 MINUTE, 4, 2, 'Atención médica concluida con receta firmada.', NOW() - INTERVAL 240 MINUTE, NOW() - INTERVAL 150 MINUTE),
(122, 22, 'PED-0004', 'PED', 'Pediatría', 'Consultorio 02', 122, 1, NULL, NOW() - INTERVAL 245 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 215 MINUTE, NOW() - INTERVAL 200 MINUTE, NOW() - INTERVAL 185 MINUTE, NOW() - INTERVAL 155 MINUTE, 4, 2, 'Atención médica concluida con receta pediátrica.', NOW() - INTERVAL 245 MINUTE, NOW() - INTERVAL 155 MINUTE),
(123, 23, 'MED-0012', 'MED', 'Medicina General', 'Consultorio 01', 123, 1, NULL, NOW() - INTERVAL 250 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 220 MINUTE, NOW() - INTERVAL 205 MINUTE, NOW() - INTERVAL 190 MINUTE, NOW() - INTERVAL 160 MINUTE, 4, 2, 'Atención médica concluida con receta para lumbalgia.', NOW() - INTERVAL 250 MINUTE, NOW() - INTERVAL 160 MINUTE),
(124, 24, 'MED-0013', 'MED', 'Medicina General', 'Consultorio 01', 124, 1, NULL, NOW() - INTERVAL 255 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 225 MINUTE, NOW() - INTERVAL 210 MINUTE, NOW() - INTERVAL 195 MINUTE, NOW() - INTERVAL 165 MINUTE, 4, 2, 'Atención médica concluida con tratamiento para gastritis.', NOW() - INTERVAL 255 MINUTE, NOW() - INTERVAL 165 MINUTE),
(125, 25, 'MED-0014', 'MED', 'Medicina General', 'Consultorio 01', 125, 1, NULL, NOW() - INTERVAL 260 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 230 MINUTE, NOW() - INTERVAL 215 MINUTE, NOW() - INTERVAL 200 MINUTE, NOW() - INTERVAL 170 MINUTE, 4, 2, 'Atención médica concluida con manejo de gonartrosis.', NOW() - INTERVAL 260 MINUTE, NOW() - INTERVAL 170 MINUTE),
(126, 26, 'GIN-0004', 'GIN', 'Ginecología', 'Tópico Ginec.', 126, 1, NULL, NOW() - INTERVAL 265 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 235 MINUTE, NOW() - INTERVAL 220 MINUTE, NOW() - INTERVAL 205 MINUTE, NOW() - INTERVAL 175 MINUTE, 4, 2, 'Atención médica ginecológica concluida.', NOW() - INTERVAL 265 MINUTE, NOW() - INTERVAL 175 MINUTE),
(127, 27, 'MED-0015', 'MED', 'Medicina General', 'Consultorio 01', 127, 1, NULL, NOW() - INTERVAL 270 MINUTE, 'finalizado', 'ninguno', NOW() - INTERVAL 240 MINUTE, NOW() - INTERVAL 225 MINUTE, NOW() - INTERVAL 210 MINUTE, NOW() - INTERVAL 180 MINUTE, 4, 2, 'Atención médica concluida con tratamiento faríngeo.', NOW() - INTERVAL 270 MINUTE, NOW() - INTERVAL 180 MINUTE),
(128, 28, 'PED-0005', 'PED', 'Pediatría', 'Consultorio 02', 128, 1, NULL, NOW() - INTERVAL 275 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 245 MINUTE, NOW() - INTERVAL 230 MINUTE, NOW() - INTERVAL 215 MINUTE, NOW() - INTERVAL 185 MINUTE, 4, 2, 'Atención médica pediátrica concluida con SRO.', NOW() - INTERVAL 275 MINUTE, NOW() - INTERVAL 185 MINUTE),
(129, 29, 'MED-0016', 'MED', 'Medicina General', 'Consultorio 01', 129, 1, NULL, NOW() - INTERVAL 280 MINUTE, 'finalizado', 'SIS', NOW() - INTERVAL 250 MINUTE, NOW() - INTERVAL 235 MINUTE, NOW() - INTERVAL 220 MINUTE, NOW() - INTERVAL 190 MINUTE, 4, 2, 'Atención médica concluida con broncodilatador.', NOW() - INTERVAL 280 MINUTE, NOW() - INTERVAL 190 MINUTE),
(130, 30, 'OFT-0003', 'OFT', 'Oftalmología', 'Módulo Visual', 130, 1, NULL, NOW() - INTERVAL 285 MINUTE, 'finalizado', 'ESSALUD', NOW() - INTERVAL 255 MINUTE, NOW() - INTERVAL 240 MINUTE, NOW() - INTERVAL 225 MINUTE, NOW() - INTERVAL 195 MINUTE, 4, 2, 'Atención oftalmológica concluida con colirio.', NOW() - INTERVAL 285 MINUTE, NOW() - INTERVAL 195 MINUTE)
ON DUPLICATE KEY UPDATE
  `ticket_number` = VALUES(`ticket_number`),
  `ticket_codigo` = VALUES(`ticket_codigo`),
  `status` = VALUES(`status`),
  `arrival_time` = VALUES(`arrival_time`),
  `triage_start_at` = VALUES(`triage_start_at`),
  `triage_end_at` = VALUES(`triage_end_at`),
  `medico_start_at` = VALUES(`medico_start_at`),
  `medico_end_at` = VALUES(`medico_end_at`),
  `notes` = VALUES(`notes`),
  `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 3. TRIAJES (20 Registros: 10 en cola médica + 10 ya finalizados)
-- Constantes vitales fisiológicas adaptadas a altitud andina (2870 msnm)
-- ------------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `triajes` (`id`, `atencion_id`, `temperatura_c`, `presion_sistolica`, `presion_diastolica`, `frecuencia_cardiaca`, `frecuencia_respiratoria`, `saturacion_o2_pct`, `saturacion_corregida`, `glucosa_mg_dl`, `peso_kg`, `talla_cm`, `imc`, `altitud_atencion_masl`, `prioridad`, `prioridad_label`, `prioridad_color`, `sintoma_principal`, `alergias_activas`, `alertas_clinicas`, `motivo_consulta`, `observaciones_triaje`, `enfermera_id`, `created_at`, `updated_at`) VALUES
-- Triajes del Grupo 2 (En espera médico: Atenciones 111 a 120)
(111, 111, 36.8, 125, 80, 78, 18, 92, 96, 95, 74.00, 168.0, 26.2, 2870, 'III', 'Estable', 'verde', 'Cefalea opresiva frontal intermitente', '[]', '[]', 'Cefalea de 3 días que no cede con paracetamol', 'Paciente lúcido, pupilas isocóricas fotorreactivas.', 3, NOW() - INTERVAL 50 MINUTE, NOW() - INTERVAL 50 MINUTE),
(112, 112, 37.1, 160, 95, 88, 20, 89, 93, 118, 51.00, 142.0, 25.3, 2870, 'II', 'Urgencia', 'amarillo', 'Presión elevada y zumbido de oídos (tinnitus)', '["Penicilina"]', '["Hipertensión Estadio 2", "Alergia a Penicilina"]', 'Mareos intensos y cefalea pulsátil', 'Se reposa 10 min y persiste PA elevada. Prioridad amarilla.', 3, NOW() - INTERVAL 55 MINUTE, NOW() - INTERVAL 55 MINUTE),
(113, 113, 36.5, 118, 76, 72, 16, 94, 98, 90, 62.00, 166.0, 22.5, 2870, 'III', 'Estable', 'verde', 'Dolor lumbar mecánico por faena comunal', '[]', '[]', 'Dolor agudo en espalda baja al agacharse', 'Movilidad limitada por contractura lumbar.', 3, NOW() - INTERVAL 58 MINUTE, NOW() - INTERVAL 58 MINUTE),
(114, 114, 38.4, 90, 60, 118, 28, 91, 95, 85, 14.50, 92.0, 17.1, 2870, 'II', 'Urgencia', 'amarillo', 'Fiebre persistente de 38.4C y tiraje leve', '[]', '["Fiebre en lactante/preescolar", "Taquipnea"]', 'Madre refiere decaimiento y dificultad para lactar/comer', 'Se administra medios físicos y se pasa a cola médica prioritaria.', 3, NOW() - INTERVAL 62 MINUTE, NOW() - INTERVAL 62 MINUTE),
(115, 115, 36.6, 130, 82, 74, 18, 93, 97, 102, 69.50, 161.0, 26.8, 2870, 'III', 'Estable', 'verde', 'Dolor articular bilateral en rodillas', '[]', '[]', 'Rigidez matutina mayor a 30 minutos', 'Crepitación articular en ambas rodillas, deambula con bastón.', 3, NOW() - INTERVAL 68 MINUTE, NOW() - INTERVAL 68 MINUTE),
(116, 116, 36.7, 110, 70, 76, 16, 94, 98, 88, 63.00, 153.0, 26.9, 2870, 'III', 'Estable', 'verde', 'Prurito y ardor genitourinario', '["Sulfas"]', '["Alergia a Sulfonamidas"]', 'Flujo blanquecino y disuria de 5 días', 'Signos vitales estables. Pasa a tópico ginecológico.', 3, NOW() - INTERVAL 70 MINUTE, NOW() - INTERVAL 70 MINUTE),
(117, 117, 36.6, 120, 80, 70, 16, 93, 97, 96, 61.00, 158.0, 24.4, 2870, 'III', 'Estable', 'verde', 'Ardor ocular y secreción amarillenta', '[]', '[]', 'Sensación de arenilla y ojo rojo bilateral', 'Inyección conjuntival moderada, córneas transparentes.', 3, NOW() - INTERVAL 74 MINUTE, NOW() - INTERVAL 74 MINUTE),
(118, 118, 36.9, 122, 78, 82, 17, 94, 98, 92, 77.00, 170.0, 26.6, 2870, 'III', 'Estable', 'verde', 'Odontalgia pulsátil en molar inferior', '[]', '[]', 'Dolor intenso exacerbado con frío/calor', 'Cavidad profunda cariosa visible en pieza 4.6.', 3, NOW() - INTERVAL 78 MINUTE, NOW() - INTERVAL 78 MINUTE),
(119, 119, 36.5, 115, 75, 75, 17, 93, 97, 94, 77.00, 170.0, 26.6, 2870, 'III', 'Estable', 'verde', 'Epigastralgia urente en ayunas', '[]', '[]', 'Pirosis y dolor retroesternal postprandial', 'Abdomen blando depresible, dolor leve en epigastrio.', 3, NOW() - INTERVAL 82 MINUTE, NOW() - INTERVAL 82 MINUTE),
(120, 120, 36.4, 138, 84, 80, 20, 90, 94, 105, 46.00, 140.0, 23.5, 2870, 'II', 'Urgencia', 'amarillo', 'Disnea de medianos esfuerzos y tos seca', '[]', '["Adulto Mayor Frágil", "SpO2 límite"]', 'Dificultad respiratoria al caminar más de 2 cuadras', 'Requiere evaluación cardiovascular y respiratoria preferente.', 3, NOW() - INTERVAL 88 MINUTE, NOW() - INTERVAL 88 MINUTE),

-- Triajes del Grupo 3 (Finalizados y Atendidos: Atenciones 121 a 130)
(121, 121, 37.0, 175, 100, 92, 22, 88, 92, 110, 66.50, 151.0, 29.2, 2870, 'I', 'Emergencia', 'rojo', 'Crisis hipertensiva y dolor torácico opresivo', '["Penicilina"]', '["Crisis Hipertensiva", "Alergia a Penicilina"]', 'Llegó con cefalea global intensa y visión borrosa', 'Manchester Rojo: Se dio atención médica inmediata.', 3, NOW() - INTERVAL 195 MINUTE, NOW() - INTERVAL 195 MINUTE),
(122, 122, 38.6, 92, 60, 124, 30, 90, 94, 86, 13.80, 91.0, 16.7, 2870, 'II', 'Urgencia', 'amarillo', 'Síndrome febril y dificultad respiratoria leve', '[]', '["Fiebre Pediátrica", "Taquipnea"]', 'Fiebre alta refractaria a paracetamol casero', 'Paciente irritable, afección de vías aéreas superiores.', 3, NOW() - INTERVAL 200 MINUTE, NOW() - INTERVAL 200 MINUTE),
(123, 123, 36.4, 128, 82, 70, 16, 93, 97, 98, 65.00, 162.0, 24.8, 2870, 'III', 'Estable', 'verde', 'Lumbago agudo incapacitante', '[]', '[]', 'Dolor paravertebral L4-S1 tras cargar sacos de papa', 'Limitación a la flexión ventral, Lasègue negativo.', 3, NOW() - INTERVAL 205 MINUTE, NOW() - INTERVAL 205 MINUTE),
(124, 124, 36.8, 118, 74, 76, 18, 94, 98, 92, 59.00, 155.0, 24.6, 2870, 'III', 'Estable', 'verde', 'Dolor epigástrico urente y náuseas', '[]', '[]', 'Acidez estomacal de 2 semanas de evolución', 'Dolor localizado a la descompresión en epigastrio.', 3, NOW() - INTERVAL 210 MINUTE, NOW() - INTERVAL 210 MINUTE),
(125, 125, 36.5, 132, 85, 68, 17, 92, 96, 108, 58.00, 156.0, 23.8, 2870, 'III', 'Estable', 'verde', 'Gonalgia bilateral y crujidos articulares', '[]', '[]', 'Dificultad para bajar pendientes y escaleras', 'Edema leve periarticular en rodilla derecha.', 3, NOW() - INTERVAL 215 MINUTE, NOW() - INTERVAL 215 MINUTE),
(126, 126, 36.7, 112, 70, 72, 16, 95, 99, 87, 62.00, 153.0, 26.5, 2870, 'III', 'Estable', 'verde', 'Síntomas ginecológicos irritativos', '[]', '[]', 'Leucorrea y molestia vulvar', 'Examen clínico ginecológico programado.', 3, NOW() - INTERVAL 220 MINUTE, NOW() - INTERVAL 220 MINUTE),
(127, 127, 37.8, 120, 78, 84, 19, 93, 97, 94, 70.00, 169.0, 24.5, 2870, 'III', 'Estable', 'verde', 'Odinofagia intensa y sensación febril', '[]', '[]', 'Dolor al tragar alimentos sólidos de 3 días', 'Faringe congestiva con placas pultáceas amigdalares.', 3, NOW() - INTERVAL 225 MINUTE, NOW() - INTERVAL 225 MINUTE),
(128, 128, 37.2, 95, 62, 110, 24, 94, 98, 90, 56.00, 152.0, 24.2, 2870, 'III', 'Estable', 'verde', 'Episodios diarreicos acuosos y cólicos', '[]', '[]', '3 cámaras diarreicas en 12 horas, sin moco ni sangre', 'Mucosa oral semihúmeda, abdomen doloroso difuso.', 3, NOW() - INTERVAL 230 MINUTE, NOW() - INTERVAL 230 MINUTE),
(129, 129, 36.6, 134, 82, 82, 22, 89, 93, 112, 67.00, 163.0, 25.2, 2870, 'II', 'Urgencia', 'amarillo', 'Broncoespasmo y sibilancias audibles', '[]', '["Asma / EPOC descompensado"]', 'Opresión torácica tras exposición a humo de leña', 'Murmullo vesicular rudo con sibilancias espiratorias.', 3, NOW() - INTERVAL 235 MINUTE, NOW() - INTERVAL 235 MINUTE),
(130, 130, 36.5, 116, 72, 70, 16, 95, 99, 89, 55.00, 157.0, 22.3, 2870, 'III', 'Estable', 'verde', 'Conjuntivitis aguda y prurito ocular', '[]', '[]', 'Lagrimeo continuo y secreción matutina purulenta', 'Eritema conjuntival marcado bilateral.', 3, NOW() - INTERVAL 240 MINUTE, NOW() - INTERVAL 240 MINUTE)
ON DUPLICATE KEY UPDATE
  `temperatura_c` = VALUES(`temperatura_c`),
  `presion_sistolica` = VALUES(`presion_sistolica`),
  `presion_diastolica` = VALUES(`presion_diastolica`),
  `saturacion_o2_pct` = VALUES(`saturacion_o2_pct`),
  `prioridad` = VALUES(`prioridad`),
  `prioridad_label` = VALUES(`prioridad_label`),
  `prioridad_color` = VALUES(`prioridad_color`),
  `sintoma_principal` = VALUES(`sintoma_principal`),
  `alergias_activas` = VALUES(`alergias_activas`),
  `updated_at` = NOW();

-- ------------------------------------------------------------------------------
-- 4. CONSULTAS Y RECETAS MÉDICAS (10 Atenciones Finalizadas: 121 a 130)
-- Con diagnósticos formales CIE-10 peruanos, planes, indicaciones y recetas completas
-- Médico tratante: Dr. Marco Huamán Quispe (CMP-89241)
-- ------------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `consultas` (`id`, `atencion_id`, `medico_id`, `motivo_consulta`, `enfermedad_actual`, `antecedentes_personales`, `antecedentes_familiares`, `examen_fisico`, `diagnosticos`, `plan_tratamiento`, `indicaciones`, `receta`, `examenes_solicitados`, `requiere_referencia`, `referencia_destino`, `referencia_urgencia`, `signature_hash`, `signed_at`, `created_at`, `updated_at`) VALUES
-- 1. Paciente 121 (Rosa Mamani Quispe - Hipertensión arterial en crisis controlada)
(121, 121, 2,
'Cefalea intensa y dolor precordial',
'Paciente mujer de 66 años, con antecedente de HTA sin tratamiento regular. Acude refiriendo cefalea holocraneana pulsátil de inicio súbito hace 4 horas, acompañada de mareos, visión borrosa (fotopsias) y sensación de opresión precordial no irradiada tras discusión familiar.',
'Hipertensión arterial diagnosticada hace 5 años con escasa adherencia al enalapril. Niega DM2. Alergia a Penicilinas.',
'Madre fallecida por evento cerebrovascular.',
'{"general": "Paciente en decúbito dorsal semisentada, diaforética pero orientada en tiempo, espacio y persona.", "cardiovascular": "Ruidos cardíacos rítmicos taquicárdicos, no soplos audibles. PA de ingreso 175/100 mmHg, post-reposo 150/90 mmHg.", "torax": "Murmullo vesicular conservado en ambos campos pulmonares sin estertores.", "neurologico": "Sin focalización neurológica, reflejos osteotendinosos normales, Glasgow 15/15."}',
'[{"cie10": "I10", "descripcion": "Hipertensión esencial (primaria)", "tipo": "definitivo"}, {"cie10": "R51", "descripcion": "Cefalea intensa", "tipo": "definitivo"}]',
'Control ambulatorio estricto de presión arterial, reinicio de antihipertensivo diario en ayunas, restricción severa de sodio.',
'Tomar Losartán 50mg cada 12 horas. Reposo relativo por 48 horas. Dieta hiposódica (sin sal agregada). Acudir a posta si la presión supera 160/100 o si presenta dolor de pecho.',
'[{"medicamento_id": 1, "nombre": "Losartán Potásico 50 mg", "forma": "Tableta", "dosis": "1 tableta cada 12 horas", "duracion": "30 días", "cantidad": 60, "indicaciones": "Tomar 8:00 AM y 8:00 PM con agua"}, {"medicamento_id": 2, "nombre": "Amlodipino 5 mg", "forma": "Tableta", "dosis": "1 tableta cada 24 horas", "duracion": "30 días", "cantidad": 30, "indicaciones": "Tomar al mediodía"}, {"medicamento_id": 3, "nombre": "Paracetamol 500 mg", "forma": "Tableta", "dosis": "1 tableta cada 8 horas condicional al dolor", "duracion": "3 días", "cantidad": 10, "indicaciones": "Solo si persiste dolor de cabeza"}]',
'["Perfil lipídico", "Creatinina sérica", "Electrocardiograma de control"]',
0, NULL, NULL,
'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', NOW() - INTERVAL 150 MINUTE, NOW() - INTERVAL 180 MINUTE, NOW() - INTERVAL 150 MINUTE),

-- 2. Paciente 122 (Dylan Gael Huallpa Ccori - Faringoamigdalitis aguda y bronquiolitis)
(122, 122, 2,
'Fiebre alta, tos y congestión nasal en niño de 3 años',
'Madre trae a menor de 3 años por cuadro de 48 horas de evolución caracterizado por alza térmica no cuantificada, rinorrea hialina abundante, tos seca en accesos y marcada inapetencia. Hace 6 horas rechaza líquidos.',
'Nacido a término, vacunas completas según esquema MINSA. Sin antecedentes alérgicos conocidos.',
'Hermanos mayores con cuadro gripal reciente.',
'{"general": "Preescolar irritable al examen, regular estado de hidratación, reactivo.", "orofaringe": "Hiperemia faríngea marcada con hipertrofia amigdalina grado II sin exudados purulentos.", "torax": "Murmullo vesicular pasa rudo bilateral, subcrepitantes aislados en bases, sin tiraje intercostal actual.", "abdomen": "Blando, depresible, no visceromegalia."}',
'[{"cie10": "J00", "descripcion": "Rinofaringitis aguda (resfriado común)", "tipo": "definitivo"}, {"cie10": "R50.9", "descripcion": "Fiebre, no especificada", "tipo": "definitivo"}]',
'Hidratación oral frecuente con sales de rehidratación o caldos tibios, antipirético según curva febril, lavado nasal con solución salina.',
'Continuar alimentación fraccionada blanda. No automedicar antibióticos. Signos de alarma: dificultad para respirar, aleteo nasal o fiebre que no cede.',
'[{"medicamento_id": 4, "nombre": "Paracetamol Jarabe 120 mg / 5 mL", "forma": "Frasco Jarabe", "dosis": "7.5 mL cada 6 a 8 horas condicional a fiebre mayor de 38°C", "duracion": "3 días", "cantidad": 1, "indicaciones": "Dar con cuchara dosificadora si temperatura > 38°C"}, {"medicamento_id": 5, "nombre": "Clorfenamina Jarabe 2 mg / 5 mL", "forma": "Frasco Jarabe", "dosis": "2.5 mL cada 8 horas", "duracion": "4 días", "cantidad": 1, "indicaciones": "Tomar después de los alimentos"}, {"medicamento_id": 6, "nombre": "Cloruro de Sodio 0.9% Gotas Nasales", "forma": "Frasco Gotero", "dosis": "3 gotas en cada fosa nasal cada 4 horas", "duracion": "5 días", "cantidad": 1, "indicaciones": "Aplicar antes de lactar o comer y al dormir"}]',
NULL, 0, NULL, NULL,
'9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7', NOW() - INTERVAL 155 MINUTE, NOW() - INTERVAL 185 MINUTE, NOW() - INTERVAL 155 MINUTE),

-- 3. Paciente 123 (Policarpio Condori Huamán - Lumbago mecánico agudo)
(123, 123, 2,
'Dolor lumbar agudo tras faena agrícola',
'Paciente varón de 63 años agricultor, acude con dolor punzante en región lumbar baja de 3 días de evolución, que se intensificó tras levantar costales de fertilizante. Refiere dificultad para mantenerse erguido y vestirse.',
'Episodios previos de lumbalgia ocupacional leve. Niega traumatismos mayores o pérdida de control de esfínteres.',
'No contributorio.',
'{"columna": "Contractura espástica severa de músculos paravertebrales lumbares bilaterales (L3-S1). Marcha antiálgica. Maniobra de Lasègue negativa bilateralmente. Reflejos rotuliano y aquiliano conservados."}',
'[{"cie10": "M54.5", "descripcion": "Lumbago no especificado", "tipo": "definitivo"}, {"cie10": "M62.8", "descripcion": "Espasmo muscular lumbar", "tipo": "definitivo"}]',
'Reposo funcional por 48 horas, calor local húmedo nocturno, tratamiento analgésico y miorrelajante. Reanudación progresiva de actividades.',
'No levantar cargas mayores a 5 kg las próximas dos semanas. Realizar estiramientos lumbares suaves al calmar el dolor agudo.',
'[{"medicamento_id": 7, "nombre": "Naproxeno 550 mg", "forma": "Tableta", "dosis": "1 tableta cada 12 horas después de comidas", "duracion": "5 días", "cantidad": 10, "indicaciones": "Tomar con abundante agua después de desayunar y cenar"}, {"medicamento_id": 8, "nombre": "Orfenadrina 100 mg", "forma": "Tableta", "dosis": "1 tableta cada 12 horas", "duracion": "4 días", "cantidad": 8, "indicaciones": "Relajante muscular nocturno y diurno"}, {"medicamento_id": 9, "nombre": "Paracetamol 500 mg", "forma": "Tableta", "dosis": "1 tableta cada 8 horas si hay dolor residual", "duracion": "3 días", "cantidad": 10, "indicaciones": "Tomar si persiste molestia"}]',
NULL, 0, NULL, NULL,
'67535edd3b83742024245645f71cb97556f8b98e099dd4e7226408114f47c022', NOW() - INTERVAL 160 MINUTE, NOW() - INTERVAL 190 MINUTE, NOW() - INTERVAL 160 MINUTE),

-- 4. Paciente 124 (Guillermina Tupayachi Mayta - Gastritis erosiva / dispepsia)
(124, 124, 2,
'Ardor de estómago intenso, acidez y náuseas',
'Paciente mujer de 36 años, refiere epigastralgia urente de 2 semanas que calma transitoriamente al ingerir alimentos y empeora con café o condimentos. Niega vómitos con sangre o melena.',
'Consumo ocasional de AINEs por cólicos menstruales. Sin alergias.',
'Madre con antecedente de colelitiasis.',
'{"abdomen": "Abdomen plano, blando, ruidos hidroaéreos normales. Dolor a la palpación profunda en epigastrio sin defensa ni rebote (Blumberg negativo). Murphy negativo."}',
'[{"cie10": "K29.7", "descripcion": "Gastritis, no especificada", "tipo": "definitivo"}, {"cie10": "K30", "descripcion": "Dispepsia funcional", "tipo": "definitivo"}]',
'Inhibidor de bomba de protones matutino, procinético sintomático, dieta fraccionada libre de picantes, grasas y gaseosas.',
'Tomar el omeprazol rigurosamente 30 minutos antes del primer alimento. Evitar café, alcohol, ají y comidas muy saladas. Cenar al menos 2 horas antes de dormir.',
'[{"medicamento_id": 10, "nombre": "Omeprazol 20 mg", "forma": "Cápsula", "dosis": "1 cápsula cada 24 horas en ayunas", "duracion": "28 días", "cantidad": 28, "indicaciones": "Tomar entera con medio vaso de agua 30 min antes del desayuno"}, {"medicamento_id": 11, "nombre": "Dimeticona + Hidróxido de Magnesio / Aluminio Gel", "forma": "Frasco Suspensión", "dosis": "1 cucharada (15 mL) 1 hora después de comidas principales y al acostarse", "duracion": "7 días", "cantidad": 1, "indicaciones": "Agitar antes de tomar"}, {"medicamento_id": 12, "nombre": "Hioscina Butilbromuro 10 mg", "forma": "Tableta", "dosis": "1 tableta cada 8 horas condicional a dolor cólico", "duracion": "3 días", "cantidad": 6, "indicaciones": "Solo en caso de dolor cólico agudo"}]',
NULL, 0, NULL, NULL,
'd04b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fa', NOW() - INTERVAL 165 MINUTE, NOW() - INTERVAL 195 MINUTE, NOW() - INTERVAL 165 MINUTE),

-- 5. Paciente 125 (Demetrio Champi Paucar - Osteoartrosis de rodilla bilateral)
(125, 125, 2,
'Dolor persistente de rodillas y crujidos al caminar',
'Paciente adulto mayor de 75 años, quechuahablante, acompañado de su hija. Refiere gonalgia bilateral de varios años de evolución con agudización en la última semana tras labores de pastoreo en laderas empinadas.',
'Sin alergias medicamentosas conocidas. Gonartrosis diagnosticada en 2021.',
'No recuerda.',
'{"extremidades": "Genu varo bilateral leve. Rodillas con engrosamiento óseo articular y crujidos palpables al movimiento pasivo y activo. Limitación para flexión extrema. No signos de derrame articular agudo ni calor local."}',
'[{"cie10": "M17.0", "descripcion": "Gonartrosis primaria bilateral", "tipo": "definitivo"}]',
'Analgésico no opiáceo de base, uso de bastón de apoyo en mano contralateral, ejercicios isométricos de cuádriceps.',
'Evitar cargar bultos pesados. Utilizar calzado con suela de goma amortiguada. Aplicar compresas tibias en las noches.',
'[{"medicamento_id": 13, "nombre": "Paracetamol 500 mg", "forma": "Tableta", "dosis": "1 tableta cada 8 horas vía oral", "duracion": "15 días", "cantidad": 45, "indicaciones": "Tomar mañana, tarde y noche después de comer"}, {"medicamento_id": 14, "nombre": "Complejo B (B1, B6, B12)", "forma": "Tableta", "dosis": "1 tableta cada 24 horas", "duracion": "30 días", "cantidad": 30, "indicaciones": "Tomar con el almuerzo"}, {"medicamento_id": 15, "nombre": "Diclofenaco en Gel 1%", "forma": "Tubo Pomada", "dosis": "Aplicar capa fina sobre ambas rodillas cada 12 horas con masaje suave", "duracion": "10 días", "cantidad": 1, "indicaciones": "Uso tópico externo. No frotar en heridas abiertas"}]',
NULL, 0, NULL, NULL,
'54a0678d910a2bb0344d952670e9a7e0a811776997ff4f04c7cb5f98cf423c91', NOW() - INTERVAL 170 MINUTE, NOW() - INTERVAL 200 MINUTE, NOW() - INTERVAL 170 MINUTE),

-- 6. Paciente 126 (Nancy Huaraca Chille - Vulvovaginitis infecciosa)
(126, 126, 2,
'Flujo genital con mal olor y picazón vulvar',
'Paciente mujer de 41 años, multípara de 3 hijos. Refiere leucorrea abundante blanco-amarillenta grumosa con prurito intenso de 1 semana de evolución.',
'G3 P3 A0. Último parto hace 10 años. Sin antecedentes crónicos. Alergia a Sulfonamidas.',
'No contributorio.',
'{"ginecologico": "Vulva eritematosa con signos de rascado. Especuloscopía muestra mucosa vaginal hiperémica con secreción blanquecina adherida en placas a paredes vaginales. Cérvix epitelizado sin lesiones sangrantes."}',
'[{"cie10": "N76.0", "descripcion": "Vaginitis aguda", "tipo": "definitivo"}, {"cie10": "B37.3", "descripcion": "Candidiasis de la vulva y de la vagina", "tipo": "definitivo"}]',
'Antifúngico oral y tópico vaginal, medidas de higiene genital, tratamiento a la pareja.',
'Abstinencia sexual durante el tratamiento (7 días). Usar ropa interior de algodón. Evitar duchas vaginales perfumadas.',
'[{"medicamento_id": 16, "nombre": "Fluconazol 150 mg", "forma": "Cápsula", "dosis": "1 cápsula en dosis única vía oral", "duracion": "1 día", "cantidad": 1, "indicaciones": "Tomar con un vaso de agua en cualquier momento"}, {"medicamento_id": 17, "nombre": "Clotrimazol 100 mg Óvulos Vaginales", "forma": "Caja Óvulos", "dosis": "1 óvulo por vía vaginal cada noche al acostarse", "duracion": "6 días", "cantidad": 6, "indicaciones": "Introducir profundamente en la vagina antes de dormir"}, {"medicamento_id": 18, "nombre": "Ketoconazol Crema Tópica 2%", "forma": "Tubo Crema", "dosis": "Aplicar en zona vulvar externa cada 12 horas", "duracion": "7 días", "cantidad": 1, "indicaciones": "Uso externo para calmar la picazón"}]',
NULL, 0, NULL, NULL,
'36720d2c4992569e5f58c70d47348e3fd658e4e70df4a1ef170960ea5fbfa956', NOW() - INTERVAL 175 MINUTE, NOW() - INTERVAL 205 MINUTE, NOW() - INTERVAL 175 MINUTE),

-- 7. Paciente 127 (Kevin Arnold Ccana Puma - Faringoamigdalitis bacteriana)
(127, 127, 2,
'Fiebre, dolor de garganta intenso y malestar general',
'Paciente varón de 23 años acude por dolor de garganta severo que le dificulta pasar saliva y deglutir sólidos desde hace 3 días. Sensación febril con escalofríos y astenia.',
'Niega alergias. Sin enfermedades crónicas.',
'No refiere.',
'{"orofaringe": "Amígdalas palatinas aumentadas de tamaño (Grado III), francamente hiperémicas con exudado purulento blanquecino en criptas amigdalinas bilaterales. Úvula edematosa central. Adenopatías cervicales anteriores dolorosas a la palpación."}',
'[{"cie10": "J03.9", "descripcion": "Amigdalitis aguda, no especificada", "tipo": "definitivo"}]',
'Antibioticoterapia oral por 7 días completos, analgésico antiinflamatorio y gargarismos tibios.',
'Cumplir los 7 días de antibiótico aunque se sienta aliviado a las 48 horas. Reposo en casa y abundantes líquidos tibios.',
'[{"medicamento_id": 19, "nombre": "Amoxicilina 500 mg", "forma": "Cápsula", "dosis": "1 cápsula cada 8 horas vía oral", "duracion": "7 días", "cantidad": 21, "indicaciones": "Tomar cada 8 horas exactas después de los alimentos"}, {"medicamento_id": 20, "nombre": "Ibuprofeno 400 mg", "forma": "Tableta", "dosis": "1 tableta cada 8 horas por 4 días", "duracion": "4 días", "cantidad": 12, "indicaciones": "Tomar con alimentos para la inflamación y el dolor"}, {"medicamento_id": 21, "nombre": "Clorhexidina Solución para Enjuague Bucal 0.12%", "forma": "Frasco", "dosis": "Gargarismos con 15 mL cada 12 horas", "duracion": "5 días", "cantidad": 1, "indicaciones": "Realizar gárgaras por 30 segundos tras cepillado y escupir"}]',
NULL, 0, NULL, NULL,
'30a1334c1a5b8e907d890e0b3c678a1bc19e5d48a0f0a5f187900b99147171d8', NOW() - INTERVAL 180 MINUTE, NOW() - INTERVAL 210 MINUTE, NOW() - INTERVAL 180 MINUTE),

-- 8. Paciente 128 (Hilda Victoria Sallo Cahuana - Enfermedad diarreica aguda)
(128, 128, 2,
'Diarrea líquida recurrente, cólicos abdominales y sed',
'Paciente mujer de 35 años, madre de familia, acude por presentar desde anoche 4 deposiciones líquidas abundantes sin moco ni sangre, acompañadas de dolor cólico periumbilical y náuseas sin vómitos. Refiere haber consumido comida en feria comunal.',
'Sin comorbilidades. Niega alergias medicamentosas.',
'Hijo menor con deposición semilíquida autolimitada.',
'{"general": "Paciente despierta, signos de deshidratación leve: lengua semihúmeda, turgencia cutánea conservada.", "abdomen": "Ruidos hidroaéreos aumentados en frecuencia e intensidad. Abdomen doloroso a la palpación difusa sin peritonismo ni visceromegalias."}',
'[{"cie10": "A09", "descripcion": "Gastroenteritis y colitis de origen no especificado", "tipo": "definitivo"}, {"cie10": "E86", "descripcion": "Depleción del volumen (Deshidratación leve)", "tipo": "definitivo"}]',
'Terapia de rehidratación oral con sales de baja osmolaridad, antiespasmódico y probiótico de restauración intestinal.',
'Disolver cada sobre de Sales de Rehidratación Oral (SRO) en exactamente 1 litro de agua hervida fría. Beber 1 vaso después de cada deposición diarreica. Dieta astringente (arroz blanco, sopa de pollo, plátano verde, manzana cocida).',
'[{"medicamento_id": 22, "nombre": "Sales de Rehidratación Oral (SRO) Polvo", "forma": "Sobres", "dosis": "1 sobre disuelto en 1 litro de agua hervida fría, beber a libre demanda", "duracion": "3 días", "cantidad": 4, "indicaciones": "Tomar un vaso grande tras cada deposición suelta"}, {"medicamento_id": 23, "nombre": "Probiótico Multiespecies (Lactobacillus / Bifidobacterium)", "forma": "Cápsula / Polvo", "dosis": "1 cápsula cada 12 horas", "duracion": "5 días", "cantidad": 10, "indicaciones": "Tomar alejado de comidas calientes"}, {"medicamento_id": 24, "nombre": "Hioscina Butilbromuro 10 mg", "forma": "Tableta", "dosis": "1 tableta cada 8 horas sólo si hay cólico fuerte", "duracion": "2 días", "cantidad": 6, "indicaciones": "Condicional al espasmo abdominal"}]',
NULL, 0, NULL, NULL,
'1f7203b5f9038421da67f928e0892a0e4450ff8e5d28b6d85a06d8495a88a03d', NOW() - INTERVAL 185 MINUTE, NOW() - INTERVAL 215 MINUTE, NOW() - INTERVAL 185 MINUTE),

-- 9. Paciente 129 (Casimiro Illapuma Huillca - Crisis asmática / EPOC leve compensado)
(129, 129, 2,
'Dificultad para respirar, silbido en el pecho y tos',
'Paciente varón de 57 años, agricultor con antecedente de cocinar con leña dentro de habitación cerrada durante 30 años. Presenta disnea progresiva, tos seca y sibilancias bilaterales audibles tras jornada fría en el campo.',
'Exposición prolongada a biomasa (humo de leña). Fumador ocasional en festividades. No alergias.',
'Hermanos asmáticos.',
'{"torax": "Tórax simétrico, hipersonoro a la percusión. Auscultación revela murmullo vesicular disminuido difuso con sibilancias espiratorias bilaterales y algunos roncus dispersos. No cianosis ungueal. SpO2 89% a 2870 msnm que sube a 94% con broncodilatador."}',
'[{"cie10": "J44.9", "descripcion": "Enfermedad pulmonar obstructiva crónica, no especificada", "tipo": "definitivo"}, {"cie10": "J45.9", "descripcion": "Asma no especificada", "tipo": "presuntivo"}]',
'Broncodilatador de acción corta en aerosol con aerocámara, corticoide inhalado de mantenimiento y medidas preventivas de biomasa.',
'Técnica correcta de inhalación: agitar inhalador, acoplar a aerocámara, exhalar, disparar e inhalar lentamente manteniendo el aire 10 segundos. Enjuagar la boca con agua tras usar el inhalador.',
'[{"medicamento_id": 25, "nombre": "Salbutamol 100 mcg / dosis Aerosol", "forma": "Inhalador 200 dosis", "dosis": "2 inhalaciones cada 6 a 8 horas con aerocámara", "duracion": "15 días", "cantidad": 1, "indicaciones": "Usar preferentemente con espaciador/aerocámara"}, {"medicamento_id": 26, "nombre": "Beclometasona 250 mcg / dosis Aerosol", "forma": "Inhalador 200 dosis", "dosis": "1 inhalación cada 12 horas", "duracion": "30 días", "cantidad": 1, "indicaciones": "Enjuagar boca y garganta tras cada uso"}, {"medicamento_id": 27, "nombre": "Prednisona 20 mg", "forma": "Tableta", "dosis": "1 tableta cada 24 horas por la mañana con desayuno", "duracion": "5 días", "cantidad": 5, "indicaciones": "Tomar temprano. No suspender bruscamente"}]',
'["Espirometría simple de control", "Radiografía de tórax PA"]',
0, NULL, NULL,
'98b4c023479a0cf5b421a8a9bc67e0b3552098d41e70d4bc3542a1bc0935bb82', NOW() - INTERVAL 190 MINUTE, NOW() - INTERVAL 220 MINUTE, NOW() - INTERVAL 190 MINUTE),

-- 10. Paciente 130 (Yanet Choqueccahua Nina - Conjuntivitis bacteriana aguda bilateral)
(130, 130, 2,
'Ojos rojos, lagañas amarillentas y sensación de arenilla',
'Paciente mujer de 31 años, trabajadora de salud técnica, presenta cuadro de 48 horas de ojos rojos en ambos lados, prurito ocular, epífora y abundante secreción mucopurulenta amarillenta que le pega los párpados por las mañanas.',
'Uso ocasional de lentes de contacto. Alergias negadas.',
'Sin antecedentes de glaucoma.',
'{"oftalmologico": "Agudeza visual conservada con cartilla Snellen (20/25 bilateral). Marcada inyección conjuntival bulbar y tarsal. Secreción mucopurulenta en fondos de saco. Córneas transparentes sin úlceras a la tinción con fluoresceína. Pupilas isocóricas reactivas."}',
'[{"cie10": "H10.0", "descripcion": "Conjuntivitis mucopurulenta", "tipo": "definitivo"}]',
'Lavado ocular con suero fisiológico estéril, colirio antibiótico bactericida de amplio espectro y gotas lubricantes.',
'Aplicar el colirio estricto cada 4 horas durante el día sin tocar la punta del gotero con el ojo o los dedos. No frotarse los ojos. Lavarse las manos antes y después de aplicar. Desechar maquillaje ocular previo.',
'[{"medicamento_id": 28, "nombre": "Ciprofloxacino 0.3% Colirio Oftálmico", "forma": "Frasco Gotero 5 mL", "dosis": "1 gota en cada ojo cada 4 horas", "duracion": "7 días", "cantidad": 1, "indicaciones": "Aplicar en el fondo de saco conjuntival inferior"}, {"medicamento_id": 29, "nombre": "Lágrimas Artificiales (Hipromelosa 0.5%)", "forma": "Frasco Gotero 15 mL", "dosis": "1 gota en cada ojo cada 6 horas condicional a resequedad", "duracion": "15 días", "cantidad": 1, "indicaciones": "Aplicar 15 minutos después del antibiótico"}, {"medicamento_id": 30, "nombre": "Paracetamol 500 mg", "forma": "Tableta", "dosis": "1 tableta cada 8 horas solo si hay cefalea o dolor periorbital", "duracion": "3 días", "cantidad": 6, "indicaciones": "Condicional al dolor"}]',
NULL, 0, NULL, NULL,
'187abf06489345c234a980dbca32077f1230e5d481b9e078cba4761093557e41', NOW() - INTERVAL 195 MINUTE, NOW() - INTERVAL 225 MINUTE, NOW() - INTERVAL 195 MINUTE)
ON DUPLICATE KEY UPDATE
  `motivo_consulta` = VALUES(`motivo_consulta`),
  `enfermedad_actual` = VALUES(`enfermedad_actual`),
  `examen_fisico` = VALUES(`examen_fisico`),
  `diagnosticos` = VALUES(`diagnosticos`),
  `plan_tratamiento` = VALUES(`plan_tratamiento`),
  `indicaciones` = VALUES(`indicaciones`),
  `receta` = VALUES(`receta`),
  `signed_at` = VALUES(`signed_at`),
  `signature_hash` = VALUES(`signature_hash`),
  `updated_at` = NOW();

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- FIN DEL SCRIPT DE SIMULACIÓN CLÍNICA (30 PACIENTES)
-- ==============================================================================
