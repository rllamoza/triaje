<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../core/Database.php';

echo "Running specialties migration...\n";

db()->exec("CREATE TABLE IF NOT EXISTS campaign_specialties (
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

$cols = db()->query('SHOW COLUMNS FROM atenciones')->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('specialty_code', $cols)) {
    db()->exec("ALTER TABLE atenciones ADD COLUMN specialty_code VARCHAR(20) DEFAULT 'MED'");
    echo "Added specialty_code to atenciones\n";
}
if (!in_array('specialty_name', $cols)) {
    db()->exec("ALTER TABLE atenciones ADD COLUMN specialty_name VARCHAR(100) DEFAULT 'Medicina General'");
    echo "Added specialty_name to atenciones\n";
}
if (!in_array('ticket_codigo', $cols)) {
    db()->exec("ALTER TABLE atenciones ADD COLUMN ticket_codigo VARCHAR(30) DEFAULT NULL");
    echo "Added ticket_codigo to atenciones\n";
}
if (!in_array('medico_id', $cols)) {
    db()->exec("ALTER TABLE atenciones ADD COLUMN medico_id BIGINT UNSIGNED DEFAULT NULL");
    echo "Added medico_id to atenciones\n";
}
if (!in_array('consultorio', $cols)) {
    db()->exec("ALTER TABLE atenciones ADD COLUMN consultorio VARCHAR(100) DEFAULT NULL");
    echo "Added consultorio to atenciones\n";
}

// Actualizar registros antiguos que tengan ticket_number pero no ticket_codigo
db()->exec("UPDATE atenciones SET ticket_codigo = CONCAT(COALESCE(specialty_code, 'MED'), '-', LPAD(ticket_number, 4, '0')) WHERE ticket_codigo IS NULL OR ticket_codigo = ''");

// Insertar especialidades por defecto para campaña 1 si no existen
$existingCount = db()->query("SELECT COUNT(*) FROM campaign_specialties WHERE campaign_id = 1")->fetchColumn();
if ($existingCount == 0) {
    // Buscar un médico
    $medico = db()->query("SELECT id FROM users WHERE role = 'medico' LIMIT 1")->fetch();
    $medicoId = $medico ? $medico['id'] : 1;

    $defaults = [
        ['campaign_id' => 1, 'specialty_code' => 'MED', 'specialty_name' => 'Medicina General', 'medico_id' => $medicoId, 'consultorio' => 'Consultorio 01', 'cupo_maximo' => 30],
        ['campaign_id' => 1, 'specialty_code' => 'PED', 'specialty_name' => 'Pediatría',        'medico_id' => $medicoId, 'consultorio' => 'Consultorio 02', 'cupo_maximo' => 20],
        ['campaign_id' => 1, 'specialty_code' => 'ODO', 'specialty_name' => 'Odontología',      'medico_id' => null,      'consultorio' => 'Box Dental',     'cupo_maximo' => 15],
        ['campaign_id' => 1, 'specialty_code' => 'GIN', 'specialty_name' => 'Ginecología',      'medico_id' => null,      'consultorio' => 'Tópico Ginec.',  'cupo_maximo' => 15],
        ['campaign_id' => 1, 'specialty_code' => 'OFT', 'specialty_name' => 'Oftalmología',     'medico_id' => null,      'consultorio' => 'Módulo Visual',  'cupo_maximo' => 20],
    ];

    $stmtIns = db()->prepare("INSERT INTO campaign_specialties (campaign_id, specialty_code, specialty_name, medico_id, consultorio, cupo_maximo, active) VALUES (:campaign_id, :specialty_code, :specialty_name, :medico_id, :consultorio, :cupo_maximo, 1)");
    foreach ($defaults as $d) {
        $stmtIns->execute($d);
    }
    echo "Inserted default campaign specialties for campaign 1\n";
}

echo "MIGRATION COMPLETED SUCCESSFULLY.\n";
