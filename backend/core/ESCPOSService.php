<?php
// ============================================================
// SEMILLA TRIAJE - Servicio ESC/POS para Tickets Térmicos
// ============================================================

class ESCPOSService
{
    private const ESC               = "\x1B";
    private const GS                = "\x1D";
    private const LF                = "\x0A";
    private const INIT              = "\x1B\x40";
    private const SELECT_CP850      = "\x1B\x74\x02";
    private const FONT_A            = "\x1B\x4D\x00"; // Font A: 12x24 dots (trazo más grande y nítido)
    private const CUT               = "\x1D\x56\x41\x00";
    private const BOLD_ON           = "\x1B\x45\x01"; // Enfatizado / Negrita ON
    private const BOLD_OFF          = "\x1B\x45\x00"; // Enfatizado OFF
    private const DOUBLE_STRIKE_ON  = "\x1B\x47\x01"; // ESC G 1: Doble pasada térmica (quema más oscuro y nítido)
    private const DOUBLE_STRIKE_OFF = "\x1B\x47\x00"; // ESC G 0: Doble pasada OFF
    private const LINE_SPACING      = "\x1B\x33\x1E"; // ESC 3 30: Espaciado entre líneas para evitar letras empastadas
    private const CENTER            = "\x1B\x61\x01";
    private const LEFT              = "\x1B\x61\x00";
    private const RIGHT             = "\x1B\x61\x02";

    public function encodeText(string $text): string
    {
        $replacements = [
            '•' => '-', '·' => '-', '–' => '-', '—' => '-',
            '“' => '"', '”' => '"', '‘' => "'", '’' => "'",
            '…' => '...', '°' => ' ', '→' => '->', '←' => '<-',
            '★' => '*', '☆' => '*',
        ];
        $text = strtr($text, $replacements);

        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'CP850//TRANSLIT//IGNORE', $text);
            if ($converted !== false && !empty($converted)) {
                return $converted;
            }
        }

        $unaccented = preg_replace(
            ['/[áàäâ]/u', '/[éèëê]/u', '/[íìïî]/u', '/[óòöô]/u', '/[úùüû]/u', '/[ñ]/u',
             '/[ÁÀÄÂ]/u', '/[ÉÈËÊ]/u', '/[ÍÌÏÎ]/u', '/[ÓÒÖÔ]/u', '/[ÚÙÜÛ]/u', '/[Ñ]/u'],
            ['a', 'e', 'i', 'o', 'u', 'n', 'A', 'E', 'I', 'O', 'U', 'N'],
            $text
        );
        return preg_replace('/[^\x20-\x7E\x0A\x0D]/', '', $unaccented);
    }

    public function wrapText(string $text, int $width = 42, string $indent = ''): string
    {
        $words = explode(' ', $text);
        $lines = [];
        $current = '';

        foreach ($words as $w) {
            $w = trim($w);
            if ($w === '') continue;
            if ($current === '') {
                $current = $w;
            } elseif (mb_strlen($current . ' ' . $w) <= $width) {
                $current .= ' ' . $w;
            } else {
                $lines[] = $current;
                $current = $w;
            }
        }
        if ($current !== '') {
            $lines[] = $current;
        }

        $out = '';
        foreach ($lines as $i => $l) {
            $prefix = ($i > 0) ? $indent : '';
            $out .= $prefix . $l . self::LF;
        }
        return $out;
    }

    public function buildQrCodeEscpos(string $data, int $size = 4): string
    {
        $trimmed = trim($data);
        if (str_starts_with($trimmed, '{') && str_ends_with($trimmed, '}')) {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded)) {
                $compact = [
                    'sistema'   => 'SEMILLA',
                    'ticket'    => $decoded['ticket'] ?? 'T-001',
                    'dni'       => $decoded['dni'] ?? '',
                    'paciente'  => $decoded['paciente'] ?? '',
                    'prioridad' => $decoded['prioridad'] ?? '',
                    'hora'      => $decoded['hora'] ?? date('H:i'),
                ];
                if (!empty($decoded['destino'])) {
                    $compact['destino'] = $decoded['destino'];
                }
                if (!empty($decoded['alergias']) && strtolower($decoded['alergias']) !== 'ninguna') {
                    $compact['alergias'] = $decoded['alergias'];
                }
                $data = json_encode($compact, JSON_UNESCAPED_UNICODE);
            }
        } elseif (strlen($data) > 180) {
            $data = substr($data, 0, 160);
        }

        $len = strlen($data);
        $moduleSize = ($size > 0 && $size <= 5) ? $size : 4;
        if ($len > 130 && $moduleSize > 3) {
            $moduleSize = 3;
        }

        $cmdLen = $len + 3;
        $pL = chr($cmdLen % 256);
        $pH = chr((int)($cmdLen / 256));

        $qr  = self::CENTER;
        $qr .= "\x1D\x28\x6B\x04\x00\x31\x41\x32\x00";
        $qr .= "\x1D\x28\x6B\x03\x00\x31\x43" . chr($moduleSize);
        $qr .= "\x1D\x28\x6B\x03\x00\x31\x45\x31";
        $qr .= "\x1D\x28\x6B" . $pL . $pH . "\x31\x50\x30" . $data;
        $qr .= "\x1D\x28\x6B\x03\x00\x31\x51\x30";
        $qr .= self::LF;
        return $qr;
    }

    public function buildTicketFromPayload(array $p): string
    {
        $ticketNum   = $p['ticket'] ?? 'T-001';
        $paciente    = $p['paciente'] ?? 'PACIENTE GENERAL';
        $dni         = $p['dni'] ?? '00000000';
        $edad        = $p['edad'] ?? '';
        $sexo        = $p['sexo'] ?? '';
        $comunidad   = $p['comunidad'] ?? 'Comunidad';
        $seguro      = $p['seguro'] ?? 'SIS Gratuito';
        $prioridad   = $p['prioridadLabel'] ?? 'NO URGENTE';
        $espera      = $p['espera'] ?? '15 min';
        $hora        = $p['hora'] ?? date('H:i');
        $fecha       = $p['fecha'] ?? date('d/m/Y');
        $destino     = $p['destino'] ?? 'Consultorio 1';
        $medico      = $p['medico'] ?? 'Médico de Guardia';
        $vitals      = $p['vitals'] ?? [];
        $receta      = $p['receta'] ?? [];
        $hash        = $p['hash'] ?? substr(hash('sha256', $ticketNum . $dni . $hora), 0, 16);
        $qrPayload   = $p['qrPayload'] ?? "HC:{$dni}|T:{$ticketNum}|PAC:{$paciente}|SEG:{$seguro}";
        $header      = $p['header'] ?? 'ONG SEMILLA - ASISTENCIA MEDICA';
        $subheader   = $p['subheader'] ?? 'RED DE ATENCION CLINICA ITINERANTE';
        $footerLegal = $p['footerLegal'] ?? 'DOCUMENTO CLINICO DE CAMPO - VALIDEZ ASISTENCIAL';

        $chkQueue   = isset($p['chkQueue']) ? filter_var($p['chkQueue'], FILTER_VALIDATE_BOOLEAN) : true;
        $chkVitals  = isset($p['chkVitals']) ? filter_var($p['chkVitals'], FILTER_VALIDATE_BOOLEAN) : true;
        $chkDestino = isset($p['chkDestino']) ? filter_var($p['chkDestino'], FILTER_VALIDATE_BOOLEAN) : true;
        $chkRx      = isset($p['chkRx']) ? filter_var($p['chkRx'], FILTER_VALIDATE_BOOLEAN) : true;
        $chkQr      = isset($p['chkQr']) ? filter_var($p['chkQr'], FILTER_VALIDATE_BOOLEAN) : true;

        $width = 42;
        $singleSep = str_repeat('-', $width) . self::LF;

        $out  = self::INIT;
        $out .= self::SELECT_CP850;
        $out .= self::FONT_A;           // Font A nativa 12x24 (la más grande y legible)
        $out .= self::DOUBLE_STRIKE_ON; // Activar doble impacto térmico (letras más oscuras y nítidas)
        $out .= self::LINE_SPACING;     // Espaciado vertical óptimo para que no se peguen las letras

        // 1. Cabecera
        $out .= self::CENTER . self::BOLD_ON;
        $out .= $this->encodeText($this->wrapText($header, 40));
        $out .= self::BOLD_OFF;
        if (!empty($subheader)) {
            $out .= self::BOLD_ON;
            $out .= $this->encodeText($this->wrapText($subheader, 40));
            $out .= self::BOLD_OFF;
        }
        $out .= $singleSep;

        // 2. Turno
        if ($chkQueue) {
            $out .= self::CENTER;
            $out .= self::BOLD_ON . $this->encodeText("TURNO DE ATENCION:\n") . self::BOLD_OFF;
            $out .= self::BOLD_ON . "\x1D\x21\x11" . $this->encodeText("{$ticketNum}\n") . "\x1D\x21\x00" . self::BOLD_OFF;
            $out .= self::BOLD_ON . $this->encodeText("PRIORIDAD: {$prioridad}\n") . self::BOLD_OFF;
            $out .= $this->encodeText("Fecha: {$fecha}  Hora: {$hora}  Espera aprox: {$espera}\n");
            $out .= $singleSep;
        }

        // 3. Paciente
        $out .= self::LEFT;
        $out .= self::BOLD_ON . $this->encodeText("PACIENTE: ") . $this->encodeText($this->wrapText($paciente, 32)) . self::BOLD_OFF . self::LF;
        $out .= self::BOLD_ON . $this->encodeText("DNI: ") . self::BOLD_OFF . $this->encodeText("{$dni} | ") . self::BOLD_ON . $this->encodeText("Edad: ") . self::BOLD_OFF . $this->encodeText("{$edad} | ") . self::BOLD_ON . $this->encodeText("Sexo: ") . self::BOLD_OFF . $this->encodeText("{$sexo}\n");
        if ($comunidad) $out .= self::BOLD_ON . $this->encodeText("Comunidad: ") . self::BOLD_OFF . $this->encodeText("{$comunidad}\n");
        if ($seguro)    $out .= self::BOLD_ON . $this->encodeText("Seguro: ") . self::BOLD_OFF . $this->encodeText("{$seguro}\n");

        // 4. Signos vitales
        if ($chkVitals && !empty($vitals)) {
            $out .= $singleSep;
            $out .= self::CENTER . self::BOLD_ON . $this->encodeText("SIGNOS VITALES TRIAJE\n") . self::BOLD_OFF . self::LEFT;
            if (!empty($vitals['pa']))   $out .= self::BOLD_ON . $this->encodeText("  P.A.: ") . self::BOLD_OFF . $this->encodeText($vitals['pa'] . " mmHg\n");
            if (!empty($vitals['temp'])) $out .= self::BOLD_ON . $this->encodeText("  Temp: ") . self::BOLD_OFF . $this->encodeText($vitals['temp'] . "\n");
            if (!empty($vitals['spo2'])) $out .= self::BOLD_ON . $this->encodeText("  SpO2: ") . self::BOLD_OFF . $this->encodeText($vitals['spo2'] . "\n");
            if (!empty($vitals['fc']))   $out .= self::BOLD_ON . $this->encodeText("  F.C.: ") . self::BOLD_OFF . $this->encodeText($vitals['fc'] . "\n");
            if (!empty($vitals['fr']))   $out .= self::BOLD_ON . $this->encodeText("  F.R.: ") . self::BOLD_OFF . $this->encodeText($vitals['fr'] . "\n");
            if (!empty($vitals['gluc']) && $vitals['gluc'] !== '--') $out .= self::BOLD_ON . $this->encodeText("  Glucosa: ") . self::BOLD_OFF . $this->encodeText($vitals['gluc'] . "\n");
        }

        // 5. Destino
        if ($chkDestino && $destino) {
            $out .= $singleSep;
            $out .= self::CENTER;
            $out .= self::BOLD_ON . $this->encodeText("DESTINO: " . strtoupper($destino) . "\n") . self::BOLD_OFF;
            if ($medico) $out .= self::BOLD_ON . $this->encodeText("Médico: ") . self::BOLD_OFF . $this->encodeText($medico . "\n");
            $out .= self::LEFT;
        }

        // 6. Receta
        if ($chkRx && !empty($receta)) {
            $out .= $singleSep;
            $out .= self::CENTER . self::BOLD_ON . $this->encodeText("RECETA MEDICA & DISPENSACION\n") . self::BOLD_OFF . self::LEFT;
            foreach ($receta as $idx => $rItem) {
                $num = $idx + 1;
                $txt = is_string($rItem) ? $rItem : ($rItem['nombre'] ?? '');
                $out .= self::BOLD_ON . "  {$num}. " . self::BOLD_OFF . $this->encodeText($this->wrapText($txt, 36, "     "));
            }
        }

        // 7. QR
        if ($chkQr && $qrPayload) {
            $out .= $singleSep;
            $out .= self::CENTER;
            $out .= self::BOLD_ON . $this->encodeText("FICHA ELECTRONICA CLINICA\n") . self::BOLD_OFF;
            $out .= self::LF;
            $out .= $this->buildQrCodeEscpos($qrPayload, 4);
            $out .= self::LF;
            $out .= self::BOLD_ON . $this->encodeText("Hash: ") . self::BOLD_OFF . $this->encodeText("{$hash}\n");
        }

        // 8. Cierre
        $out .= $singleSep;
        $out .= self::CENTER;
        $out .= self::BOLD_ON . $this->encodeText("\"Allillanchu kashanki?\"\n") . self::BOLD_OFF;
        $out .= self::BOLD_ON . $this->encodeText("Presente este comprobante para su atencion.\n") . self::BOLD_OFF;
        if ($footerLegal) $out .= $this->encodeText($this->wrapText($footerLegal, 40));
        $out .= "\n\n\n\n";
        $out .= self::CUT;

        return base64_encode($out);
    }

    public function buildAdmisionTicket(array $atencion): string
    {
        $t = $atencion['triaje'] ?? null;
        $b = $atencion['beneficiario'] ?? [];
        $prioridadLabel = 'PENDIENTE TRIAJE';
        if ($t) {
            $prioridadLabel = match($t['prioridad'] ?? '') {
                'I'     => 'EMERGENCIA (ROJO)',
                'II'    => 'URGENTE (AMARILLO)',
                default => 'NO URGENTE (VERDE)',
            };
        }

        $vitals = [];
        if ($t) {
            if (!empty($t['presion_sistolica'])) $vitals['pa'] = "{$t['presion_sistolica']}/{$t['presion_diastolica']}";
            if (!empty($t['temperatura_c']))     $vitals['temp'] = "{$t['temperatura_c']} °C";
            if (!empty($t['saturacion_o2_pct'])) $vitals['spo2'] = "{$t['saturacion_o2_pct']}%";
            if (!empty($t['frecuencia_cardiaca'])) $vitals['fc'] = "{$t['frecuencia_cardiaca']} lpm";
            if (!empty($t['frecuencia_respiratoria'])) $vitals['fr'] = "{$t['frecuencia_respiratoria']} rpm";
            if (!empty($t['glucosa_mg_dl'])) $vitals['gluc'] = "{$t['glucosa_mg_dl']} mg/dL";
        }

        $payload = [
            'ticket'         => 'T-' . ($atencion['ticket_number'] ?? '1'),
            'paciente'       => trim(($b['nombres'] ?? '') . ' ' . ($b['apellidos'] ?? '')),
            'dni'            => $b['dni'] ?? '',
            'edad'           => ($b['edad_calculada'] ?? '') . ' años',
            'sexo'           => $b['sexo'] ?? '',
            'comunidad'      => $b['comunidad'] ?? '',
            'prioridadLabel' => $prioridadLabel,
            'espera'         => '10 min',
            'header'         => 'ONG SEMILLA - TURNO',
            'subheader'      => $atencion['campaign_name'] ?? 'Campaña Médica Rural',
            'destino'        => $atencion['station_label'] ?? 'Estación de Triaje',
            'vitals'         => $vitals,
            'chkQueue'       => true,
            'chkVitals'      => !empty($vitals),
            'chkDestino'     => true,
            'chkRx'          => false,
            'chkQr'          => true,
            'qrPayload'      => "TRIAJE|T-{$atencion['ticket_number']}|" . ($b['dni'] ?? '') . "|{$atencion['id']}",
        ];

        return $this->buildTicketFromPayload($payload);
    }

    public function buildRecetaTicket(array $atencion): string
    {
        $b = $atencion['beneficiario'] ?? [];
        $c = $atencion['consulta'] ?? [];

        $payload = [
            'ticket'         => 'T-' . ($atencion['ticket_number'] ?? '1'),
            'paciente'       => trim(($b['nombres'] ?? '') . ' ' . ($b['apellidos'] ?? '')),
            'dni'            => $b['dni'] ?? '',
            'edad'           => ($b['edad_calculada'] ?? '') . ' años',
            'sexo'           => $b['sexo'] ?? '',
            'comunidad'      => $b['comunidad'] ?? '',
            'prioridadLabel' => 'RECETA Y CONSULTA',
            'destino'        => $atencion['station_label'] ?? 'Consultorio Médico',
            'medico'         => $c['medico_nombre'] ?? 'Médico Asignado',
            'header'         => 'ONG SEMILLA',
            'subheader'      => $atencion['campaign_name'] ?? 'Campaña Médica',
            'receta'         => is_array($c['receta'] ?? null) ? $c['receta'] : [],
            'chkQueue'       => true,
            'chkVitals'      => false,
            'chkDestino'     => true,
            'chkRx'          => true,
            'chkQr'          => true,
            'qrPayload'      => "RECETA|{$atencion['ticket_number']}|" . ($b['dni'] ?? '') . "|{$atencion['id']}",
        ];

        return $this->buildTicketFromPayload($payload);
    }

    public function getAvailablePrinters(): array
    {
        $printers = [];
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            try {
                $cmd = 'powershell.exe -NoProfile -Command "Get-Printer | Select-Object Name, Type, DriverName, PortName, Shared, PrinterStatus | ConvertTo-Json -Compress" 2>nul';
                $json = @shell_exec($cmd);
                if ($json) {
                    $decoded = json_decode($json, true);
                    if (isset($decoded['Name'])) $decoded = [$decoded];
                    if (is_array($decoded)) {
                        foreach ($decoded as $p) {
                            $name = $p['Name'] ?? '';
                            $driver = $p['DriverName'] ?? '';
                            $isT88 = (stripos($name, 'T88') !== false) || (stripos($driver, 'T88') !== false) || (stripos($name, 'TM-T') !== false);
                            $isEpson = (stripos($name, 'EPSON') !== false);
                            $printers[] = [
                                'id'           => $name,
                                'name'         => $name,
                                'port'         => $p['PortName'] ?? '',
                                'driver'       => $driver,
                                'is_t88'       => $isT88,
                                'is_epson'     => $isEpson,
                                'status_label' => 'Listo',
                            ];
                        }
                    }
                }
            } catch (Throwable) {}
        }
        return $printers;
    }

    public function printRaw(string $base64Data, ?string $printerName = null, ?string $ip = null, int $port = 9100): array
    {
        // 1. Red TCP Socket si se especifica IP
        if (!empty($ip)) {
            try {
                $rawBytes = base64_decode($base64Data);
                $socket = @fsockopen($ip, $port, $errno, $errstr, 4);
                if (!$socket) {
                    throw new Exception("No se pudo conectar a {$ip}:{$port} - {$errstr} ({$errno})");
                }
                fwrite($socket, $rawBytes);
                fclose($socket);
                return [
                    'success' => true,
                    'printer' => "Red TCP ({$ip}:{$port})",
                    'method'  => 'network_tcp',
                    'bytes'   => strlen($rawBytes),
                    'message' => "Ticket enviado exitosamente a impresora en {$ip}:{$port}",
                ];
            } catch (Throwable $e) {
                // Continuar a spooler local
            }
        }

        // 2. Windows Raw Spooler
        $psScript = dirname(__DIR__) . '/core/RawPrinterHelper.ps1';
        if (!file_exists($psScript)) {
            $psScript = dirname(__DIR__) . '/app/Services/RawPrinterHelper.ps1';
        }

        if (empty($printerName) || $printerName === 'auto' || $printerName === 'BT-POS-01') {
            $printers = $this->getAvailablePrinters();
            $t88 = null;
            foreach ($printers as $pr) {
                if ($pr['is_t88']) { $t88 = $pr; break; }
            }
            $printerName = $t88 ? $t88['name'] : 'EPSON TM-T88V Receipt';
        }

        if (file_exists($psScript) && strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $tempFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ticket_' . uniqid() . '.bin';
            file_put_contents($tempFile, base64_decode($base64Data));

            $cmd = sprintf(
                'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%s" -PrinterName "%s" -FilePath "%s" 2>&1',
                $psScript,
                addslashes($printerName),
                $tempFile
            );

            $output = @shell_exec($cmd);
            @unlink($tempFile);

            if ($output) {
                $result = json_decode($output, true);
                if ($result && !empty($result['Success'])) {
                    return [
                        'success' => true,
                        'printer' => $result['Printer'] ?? $printerName,
                        'method'  => 'windows_raw_spooler',
                        'bytes'   => $result['BytesCount'] ?? strlen(base64_decode($base64Data)),
                        'message' => "¡Ticket impreso y cortado exitosamente en {$printerName}!",
                    ];
                }
            }
        }

        return [
            'success' => false,
            'printer' => $printerName,
            'message' => 'No se pudo enviar al spooler o entorno sin impresora física directa conectada.',
        ];
    }
}
