<?php
namespace App\Services;

class TriajeAlertService
{
    public function evaluate(array $vitals, int $altitudMasl = 0, int $edad = 30): array
    {
        $alerts = [];
        $spo2Threshold = $this->getSpo2Threshold($altitudMasl);

        if (isset($vitals['saturacion_o2_pct']) && $vitals['saturacion_o2_pct'] < $spo2Threshold) {
            $alerts[] = ['tipo' => 'danger', 'campo' => 'spo2', 'mensaje' => "SpO2 bajo para altitud ({$altitudMasl}m): mín {$spo2Threshold}%"];
        }
        if (isset($vitals['temperatura_c'])) {
            if ($vitals['temperatura_c'] >= 38.5) $alerts[] = ['tipo' => 'danger', 'campo' => 'temperatura', 'mensaje' => 'Fiebre alta ≥38.5°C'];
            if ($vitals['temperatura_c'] >= 37.5) $alerts[] = ['tipo' => 'warning', 'campo' => 'temperatura', 'mensaje' => 'Febrícula 37.5-38.4°C'];
            if ($vitals['temperatura_c'] < 36.0)  $alerts[] = ['tipo' => 'warning', 'campo' => 'temperatura', 'mensaje' => 'Hipotermia <36°C'];
        }
        if (isset($vitals['presion_sistolica'])) {
            if ($vitals['presion_sistolica'] >= 180 || ($vitals['presion_diastolica'] ?? 0) >= 110)
                $alerts[] = ['tipo' => 'danger', 'campo' => 'pa', 'mensaje' => 'Crisis hipertensiva'];
            elseif ($vitals['presion_sistolica'] >= 140)
                $alerts[] = ['tipo' => 'warning', 'campo' => 'pa', 'mensaje' => 'Hipertensión Grado I-II'];
            elseif ($vitals['presion_sistolica'] < 90)
                $alerts[] = ['tipo' => 'danger', 'campo' => 'pa', 'mensaje' => 'Hipotensión sistólica'];
        }
        if (isset($vitals['frecuencia_cardiaca'])) {
            if ($vitals['frecuencia_cardiaca'] > 100) $alerts[] = ['tipo' => 'warning', 'campo' => 'fc', 'mensaje' => 'Taquicardia >100ppm'];
            if ($vitals['frecuencia_cardiaca'] < 60)  $alerts[] = ['tipo' => 'warning', 'campo' => 'fc', 'mensaje' => 'Bradicardia <60ppm'];
        }
        if (isset($vitals['glucosa_mg_dl'])) {
            if ($vitals['glucosa_mg_dl'] > 200) $alerts[] = ['tipo' => 'danger', 'campo' => 'glucosa', 'mensaje' => 'Hiperglucemia >200mg/dl'];
            if ($vitals['glucosa_mg_dl'] < 70)  $alerts[] = ['tipo' => 'danger', 'campo' => 'glucosa', 'mensaje' => 'Hipoglucemia <70mg/dl'];
        }

        return $alerts;
    }

    public function getSpo2Threshold(int $altitudMasl): int
    {
        if ($altitudMasl < 1500) return 95;
        if ($altitudMasl < 2500) return 93;
        if ($altitudMasl < 3500) return 91;
        return 89;
    }

    public function suggestPriority(array $alerts, array $vitals): string
    {
        $hasDanger = collect($alerts)->contains('tipo', 'danger');
        $hasWarning = collect($alerts)->contains('tipo', 'warning');
        if ($hasDanger) return 'I';
        if ($hasWarning) return 'II';
        return 'III';
    }
}
