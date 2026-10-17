<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../core/Database.php';

echo "Executing seed_simulacion_30_pacientes.sql...\n";
$sql = file_get_contents(__DIR__ . '/seed_simulacion_30_pacientes.sql');

try {
    db()->exec($sql);
    echo "SUCCESS: Seed SQL script executed successfully!\n";
    
    // Validate record counts
    $beneficiariosCount = db()->query("SELECT COUNT(*) FROM beneficiarios WHERE id BETWEEN 101 AND 130")->fetchColumn();
    $atencionesCount = db()->query("SELECT COUNT(*) FROM atenciones WHERE id BETWEEN 101 AND 130")->fetchColumn();
    $esperaTriaje = db()->query("SELECT COUNT(*) FROM atenciones WHERE id BETWEEN 101 AND 130 AND status = 'en_espera_triaje'")->fetchColumn();
    $esperaMedico = db()->query("SELECT COUNT(*) FROM atenciones WHERE id BETWEEN 101 AND 130 AND status = 'en_espera_medico'")->fetchColumn();
    $finalizados = db()->query("SELECT COUNT(*) FROM atenciones WHERE id BETWEEN 101 AND 130 AND status = 'finalizado'")->fetchColumn();
    $triajesCount = db()->query("SELECT COUNT(*) FROM triajes WHERE atencion_id BETWEEN 101 AND 130")->fetchColumn();
    $consultasCount = db()->query("SELECT COUNT(*) FROM consultas WHERE atencion_id BETWEEN 101 AND 130")->fetchColumn();

    echo "--- SUMMARY OF INSERTED DATA ---\n";
    echo "Beneficiarios creados: $beneficiariosCount / 30\n";
    echo "Atenciones creadas:    $atencionesCount / 30\n";
    echo "  - En espera triaje:  $esperaTriaje (Esperado: 10)\n";
    echo "  - En espera médico:  $esperaMedico (Esperado: 10)\n";
    echo "  - Finalizados con Rx:$finalizados (Esperado: 10)\n";
    echo "Triajes registrados:   $triajesCount (Esperado: 20)\n";
    echo "Consultas con receta:  $consultasCount (Esperado: 10)\n\n";

    echo "--- DETALLE DE PACIENTES GENERADOS ---\n";
    $rows = db()->query("
        SELECT a.id, a.ticket_codigo, a.status, a.specialty_name,
               CONCAT(b.nombres, ' ', b.apellidos) as paciente, b.dni,
               t.prioridad_label, t.temperatura_c, t.presion_sistolica, t.presion_diastolica,
               co.signed_at, co.diagnosticos
        FROM atenciones a
        LEFT JOIN beneficiarios b ON b.id = a.beneficiario_id
        LEFT JOIN triajes t ON t.atencion_id = a.id
        LEFT JOIN consultas co ON co.atencion_id = a.id
        WHERE a.id BETWEEN 101 AND 130
        ORDER BY a.id ASC
    ")->fetchAll();

    foreach ($rows as $r) {
        $dx = 'Sin consulta';
        if ($r['diagnosticos']) {
            $dxJson = json_decode($r['diagnosticos'], true);
            $dx = $dxJson[0]['cie10'] . ' - ' . $dxJson[0]['descripcion'];
        }
        $vitals = $r['temperatura_c'] ? "{$r['temperatura_c']}°C, {$r['presion_sistolica']}/{$r['presion_diastolica']}" : "Sin triaje";
        printf("#%-3d | %-9s | %-17s | %-8s | %-26s | %-16s | %s\n",
            $r['id'], $r['ticket_codigo'], $r['status'], $r['dni'], substr($r['paciente'], 0, 26), $vitals, substr($dx, 0, 45)
        );
    }
} catch (PDOException $e) {
    echo "ERROR EXECUTING SQL: " . $e->getMessage() . "\n";
}
