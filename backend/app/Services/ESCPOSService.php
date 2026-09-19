<?php
namespace App\Services;

use App\Models\Atencion;

class ESCPOSService
{
    private const ESC  = "\x1B";
    private const GS   = "\x1D";
    private const LF   = "\x0A";
    private const INIT = "\x1B\x40";
    private const CUT  = "\x1D\x56\x41\x00";
    private const BOLD_ON  = "\x1B\x45\x01";
    private const BOLD_OFF = "\x1B\x45\x00";
    private const CENTER   = "\x1B\x61\x01";
    private const LEFT     = "\x1B\x61\x00";
    private const RIGHT    = "\x1B\x61\x02";

    public function buildRecetaTicket(Atencion $atencion): string
    {
        $b    = $atencion->beneficiario;
        $t    = $atencion->triaje;
        $c    = $atencion->consulta;
        $camp = $atencion->campaign;

        $out  = self::INIT;
        $out .= self::CENTER . self::BOLD_ON . "ONG SEMILLA" . self::LF . self::BOLD_OFF;
        $out .= $camp->name . self::LF;
        $out .= str_repeat('-', 32) . self::LF;
        $out .= self::LEFT;
        $out .= self::BOLD_ON . "T-{$atencion->ticket_number}" . self::BOLD_OFF;
        $out .= "  " . now()->format('d/m/Y H:i') . self::LF;
        $out .= $b->full_name . self::LF;
        $out .= "DNI: {$b->dni}  Edad: {$b->edad}a {$b->sexo}" . self::LF;
        $out .= "Seguro: " . ($atencion->seguro_usado ?? $b->tipo_seguro) . self::LF;
        $out .= str_repeat('-', 32) . self::LF;

        if ($c?->medico) {
            $out .= "Dr/a. {$c->medico->full_name}" . self::LF;
        }

        if ($c?->diagnosticos) {
            $out .= str_repeat('-', 32) . self::LF;
            $out .= self::BOLD_ON . "DIAGNOSTICO:" . self::BOLD_OFF . self::LF;
            foreach ($c->diagnosticos as $dx) {
                $out .= "* [{$dx['cie10']}] {$dx['descripcion']}" . self::LF;
            }
        }

        if ($c?->receta) {
            $out .= str_repeat('-', 32) . self::LF;
            $out .= self::BOLD_ON . "RECETA MEDICA:" . self::BOLD_OFF . self::LF;
            foreach ($c->receta as $i => $med) {
                $n = $i + 1;
                $out .= "{$n}. {$med['nombre']} {$med['dosis']}" . self::LF;
                $out .= "   {$med['frecuencia']} x {$med['duracion']}" . self::LF;
                $out .= "   Cant: {$med['cantidad']} unidades" . self::LF;
            }
        }

        if ($c?->indicaciones) {
            $out .= str_repeat('-', 32) . self::LF;
            $wrapped = wordwrap($c->indicaciones, 32, "\n", true);
            $out .= $wrapped . self::LF;
        }

        $out .= str_repeat('-', 32) . self::LF;
        $out .= self::CENTER . "semilla.pe" . self::LF;
        $out .= str_repeat("\n", 3);
        $out .= self::CUT;

        return base64_encode($out);
    }

    public function buildAdmisionTicket(Atencion $atencion): string
    {
        $b    = $atencion->beneficiario;
        $camp = $atencion->campaign;
        $t    = $atencion->triaje;

        $prioridad_label = $t ? match($t->prioridad) {
            'I'   => '★★★ EMERGENCIA (ROJO)',
            'II'  => '★★  URGENTE (AMARILLO)',
            default => '★   NO URGENTE (VERDE)',
        } : 'PENDIENTE TRIAJE';

        $out  = self::INIT;
        $out .= self::CENTER . self::BOLD_ON . "ONG SEMILLA - TURNO" . self::LF;
        $out .= self::BOLD_OFF . $camp->name . self::LF;
        $out .= str_repeat('=', 32) . self::LF;
        $out .= self::BOLD_ON;
        // Número de turno grande
        $out .= self::GS . "!" . chr(0x11); // doble altura+ancho
        $out .= "  T-{$atencion->ticket_number}  " . self::LF;
        $out .= self::GS . "!" . chr(0x00); // restaurar
        $out .= self::BOLD_OFF;
        $out .= str_repeat('=', 32) . self::LF;
        $out .= self::LEFT;
        $out .= $b->full_name . self::LF;
        $out .= "DNI: {$b->dni}  " . now()->format('H:i') . self::LF;
        $out .= str_repeat('-', 32) . self::LF;
        $out .= self::BOLD_ON . $prioridad_label . self::BOLD_OFF . self::LF;
        $out .= str_repeat('-', 32) . self::LF;
        $out .= "Llegada: " . $atencion->arrival_time->format('d/m/Y H:i') . self::LF;
        $out .= str_repeat("\n", 4) . self::CUT;

        return base64_encode($out);
    }
}
