import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { useBrandingStore } from '../../store/brandingStore'
import { useScannerStore } from '../../store/scannerStore'
import { PATIENT_DATABASE, generatePatientQrPayload, type DetailedPatient } from '../../services/patientRegistry'

export default function TicketPage() {
  const branding = useBrandingStore()
  const { openScanner, showPatientDetail } = useScannerStore()

  // Patient Selection
  const [currentPatient, setCurrentPatient] = useState<DetailedPatient>(PATIENT_DATABASE[0])
  const [searchInput, setSearchInput] = useState('42918274')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Checkboxes
  const [chkQueue, setChkQueue] = useState(true)
  const [chkVitals, setChkVitals] = useState(true)
  const [chkDestino, setChkDestino] = useState(true)
  const [chkRx, setChkRx] = useState(true)
  const [chkQr, setChkQr] = useState(true)

  const [printStatus, setPrintStatus] = useState<string | null>(null)

  // Generate authentic scannable QR code whenever currentPatient or options change
  useEffect(() => {
    const payload = generatePatientQrPayload(currentPatient)
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 5,
      color: {
        dark: '#111111',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url)
      })
      .catch((err) => {
        console.error('Error generating QR code:', err)
      })
  }, [currentPatient])

  const handleSearch = () => {
    const term = searchInput.trim().toLowerCase()
    if (!term) return

    const match = PATIENT_DATABASE.find(
      (p) =>
        p.ticket.toLowerCase().includes(term) ||
        p.dni.includes(term) ||
        p.paciente.toLowerCase().includes(term)
    )

    if (match) {
      setCurrentPatient(match)
    }
  }

  const handlePrint = () => {
    setPrintStatus('Enviando comando ESC/POS vía Bluetooth a BT-POS-01...')
    setTimeout(() => {
      setPrintStatus('¡Ticket impreso y cortado exitosamente con código QR de alta fidelidad!')
      setTimeout(() => setPrintStatus(null), 3500)
    }, 1200)
  }

  const isRojo = currentPatient.prioridad === 'rojo'
  const isAmarillo = currentPatient.prioridad === 'amarillo'

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Contextual Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              POS-06
            </span>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-surface-container text-on-surface-variant flex items-center gap-1.5 border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              Impresora Bluetooth: BT-POS-01 (Conectada)
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Emisión de Ticket Térmico <span className="font-semibold text-primary">&amp; Comprobante ESC/POS</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            title="Escanear cualquier ticket o QR de paciente"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Escanear QR</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant bg-surface px-3 py-2 border border-surface-container-high">
            <span className="material-symbols-outlined text-[18px] text-tertiary">print</span>
            <span>Baudrate: 115200 (8N1) • Papel: 58mm</span>
          </div>
        </div>
      </div>

      {printStatus && (
        <div className="p-3 mb-6 bg-tertiary-container text-on-tertiary-container text-xs flex items-center gap-2 border border-tertiary/30 font-semibold">
          <span className="material-symbols-outlined text-base">print</span>
          <span>{printStatus}</span>
        </div>
      )}

      {/* Main Workspace Split: Configurator vs Real-Time Thermal Receipt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Configurator, Patient Selection & Fast Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Patient Selector */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                1. Paciente Seleccionado para Emisión
              </span>
              <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[11px] font-mono font-bold">
                Triaje Validado
              </span>
            </div>

            {/* Fast Search & Scan Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                  search
                </span>
                <input
                  className="w-full h-10 pl-10 pr-4 bg-surface-container-low text-xs font-mono text-on-surface border border-surface-container-high focus:outline-none focus:border-primary"
                  placeholder="Buscar por DNI, Nombre o #Ticket..."
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="h-10 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-mono border border-surface-container-high transition-colors cursor-pointer"
              >
                Buscar
              </button>

              <button
                type="button"
                onClick={openScanner}
                className="h-10 px-3 bg-primary text-on-primary text-xs font-mono font-bold flex items-center gap-1 hover:bg-on-primary-fixed-variant transition-colors cursor-pointer"
                title="Escanear ticket para cargarlo"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>

            {/* Quick Patient Switcher Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-mono text-on-surface-variant mr-1">Rápidos:</span>
              {PATIENT_DATABASE.map((p) => (
                <button
                  key={p.ticket}
                  type="button"
                  onClick={() => {
                    setCurrentPatient(p)
                    setSearchInput(p.dni)
                  }}
                  className={`px-2 py-1 text-[11px] font-mono border transition-colors cursor-pointer ${
                    currentPatient.ticket === p.ticket
                      ? 'bg-primary text-on-primary border-primary font-bold'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-surface-container-high'
                  }`}
                >
                  #{p.ticket} • {p.paciente.split(',')[0]}
                </button>
              ))}
            </div>

            {/* Active Loaded Record Card */}
            <div className="bg-surface-container-low p-4 border border-surface-container-high flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-on-surface">{currentPatient.paciente}</span>
                  <span className="px-2 py-0.5 bg-surface-container-high text-[11px] font-mono font-semibold text-on-surface">
                    {currentPatient.edad}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  DNI: {currentPatient.dni} • Procedencia: {currentPatient.comunidad}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 font-bold ${
                    isRojo ? 'bg-error text-on-error' : isAmarillo ? 'bg-[#f1c21b] text-[#161616]' : 'bg-tertiary text-on-tertiary'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    {currentPatient.prioridadLabel}
                  </span>
                  {currentPatient.alergias && currentPatient.alergias.toLowerCase() !== 'ninguna' && (
                    <span className="text-[11px] font-mono text-error font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      {currentPatient.alergias}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center sm:pl-4">
                <span className="text-xs font-mono text-secondary">Código Turno</span>
                <span className="text-3xl font-mono font-bold text-primary">#{currentPatient.ticket}</span>
              </div>
            </div>

            {/* Action to view full clinical details */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => showPatientDetail(currentPatient)}
                className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Ver Ficha Médica Completa del Paciente</span>
              </button>
            </div>
          </div>

          {/* Ticket Payload Selection (ESC/POS Modules) */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-on-surface">
              2. Secciones a Incluir en Ticket (Comandos ESC/POS)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={chkQueue}
                  onChange={(e) => setChkQueue(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary rounded-none"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">Ticket de Cola &amp; Triaje</span>
                  <span className="text-[11px] text-secondary">Cabecera comunal, código gigante y box.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={chkVitals}
                  onChange={(e) => setChkVitals(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary rounded-none"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">Constantes Vitales</span>
                  <span className="text-[11px] text-secondary">PA, FC, T°, SpO2 altitudinal y glucemia.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={chkDestino}
                  onChange={(e) => setChkDestino(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary rounded-none"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">Destino Clínico Asignado</span>
                  <span className="text-[11px] text-secondary">Consultorio médico y doctor responsable.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors">
                <input
                  type="checkbox"
                  checked={chkRx}
                  onChange={(e) => setChkRx(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary rounded-none"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface">Receta Médica en Campaña</span>
                  <span className="text-[11px] text-secondary">Posología y medicamentos prescritos.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors sm:col-span-2">
                <input
                  type="checkbox"
                  checked={chkQr}
                  onChange={(e) => setChkQr(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary rounded-none"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">Código QR Scannable ISO/IEC 18004</span>
                    <span className="px-1.5 py-0.2 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">
                      Activo &amp; Scannable
                    </span>
                  </div>
                  <span className="text-[11px] text-secondary">
                    Contiene la ficha médica codificada. Al escanearlo abre toda la información del paciente.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 py-3 px-6 bg-primary text-on-primary font-mono font-bold text-sm tracking-wide uppercase hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span>Imprimir Ticket ESC/POS</span>
            </button>

            <button
              type="button"
              onClick={() => showPatientDetail(currentPatient)}
              className="py-3 px-6 bg-surface hover:bg-surface-container text-on-surface font-mono font-bold text-sm border border-surface-container-high transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">clinical_notes</span>
              <span>Ver Ficha Detallada</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Thermal Receipt Preview (58mm Emulation) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 mb-2 text-xs font-mono text-on-surface-variant">
            <span>VISTA PREVIA TÉRMICA (58mm)</span>
            <span className="text-primary font-semibold">ESCALA 1:1 REAL</span>
          </div>

          <div className="w-[320px] bg-[#fafafa] text-[#111111] p-5 shadow-2xl border border-[#d0d0d0] font-mono text-xs select-none">
            {/* Thermal Header */}
            <div className="text-center flex flex-col items-center gap-1 border-b border-dashed border-[#111111] pb-3">
              {branding.ticketLogoUrl && (
                <img
                  src={branding.ticketLogoUrl}
                  alt="Logo Ticket"
                  className="h-10 w-auto max-w-[140px] object-contain mb-1 filter grayscale contrast-200"
                />
              )}
              <div className="font-bold text-sm tracking-tight">{branding.exportHeader}</div>
              <div className="text-[10px] leading-tight">{branding.exportSubheader}</div>
              <div className="text-[8px] tracking-widest mt-1 opacity-80">
                ================================
              </div>
            </div>

            {/* Big Ticket Box */}
            {chkQueue && (
              <div className="flex flex-col items-center py-2 bg-[#f0f0f0] p-2 my-1">
                <div className="text-[10px] tracking-widest font-semibold">NÚMERO DE ATENCIÓN EN COLA</div>
                <div className="text-3xl font-black tracking-tighter my-0.5 text-[#000000]">
                  # {currentPatient.ticket}
                </div>
                <div className="text-[9px] font-semibold">HORA EMISIÓN: 19/SEP/2026 - {currentPatient.hora}</div>
              </div>
            )}

            {/* Priority Indicator */}
            <div className="bg-[#111111] text-[#ffffff] px-2 py-1.5 text-center flex flex-col gap-0.5 my-1.5">
              <div className="text-[11px] font-black tracking-widest">
                *** {currentPatient.prioridadLabel.toUpperCase()} ***
              </div>
              <div className="text-[9px] font-mono opacity-90">TIEMPO ESTIMADO ESPERA: ~{currentPatient.espera}</div>
            </div>

            {/* Patient Demographic */}
            <div className="flex flex-col gap-0.5 text-[10px] my-2">
              <div className="flex justify-between font-semibold">
                <span>PACIENTE:</span>
                <span className="font-bold">{currentPatient.paciente}</span>
              </div>
              <div className="flex justify-between">
                <span>DNI / HISTORIA:</span>
                <span>{currentPatient.dni} / HC-2026-089</span>
              </div>
              <div className="flex justify-between">
                <span>EDAD / SEXO:</span>
                <span>{currentPatient.edad.toUpperCase()} / {currentPatient.sexo === 'M' ? 'MASCULINO' : 'FEMENINO'}</span>
              </div>
              <div className="flex justify-between">
                <span>COMUNIDAD:</span>
                <span className="truncate max-w-[180px]">{currentPatient.comunidad}</span>
              </div>
            </div>

            {/* Severe Allergy Negative Box */}
            {currentPatient.alergias && currentPatient.alergias.toLowerCase() !== 'ninguna' && (
              <div className="bg-[#111111] text-[#ffffff] px-2 py-1 text-center font-bold text-[10px] tracking-tight my-1.5">
                ! ! ! ALERTA: {currentPatient.alergias.toUpperCase()} ! ! !
              </div>
            )}

            {/* Vitals Summary Strip */}
            {chkVitals && (
              <div className="flex flex-col gap-1 p-2 bg-[#eeeeee] text-[10px] my-1.5">
                <div className="text-[9px] font-bold uppercase tracking-wider text-center border-b border-dashed border-[#888888] pb-1 mb-1">
                  Constantes Vitales de Triaje
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <div>PA: <strong className="font-bold">{currentPatient.vitals.pa}</strong></div>
                  <div>FC: <strong className="font-bold">{currentPatient.vitals.fc}</strong></div>
                  <div>TEMP: <strong className="font-bold">{currentPatient.vitals.temp}</strong></div>
                  <div>SpO2: <strong className="font-bold">{currentPatient.vitals.spo2}</strong></div>
                  <div>FR: <strong className="font-bold">{currentPatient.vitals.fr}</strong></div>
                  <div>GLUC: <strong className="font-bold">{currentPatient.vitals.gluc}</strong></div>
                </div>
              </div>
            )}

            {/* Destination Box */}
            {chkDestino && (
              <div className="p-2 border-2 border-[#111111] text-center flex flex-col my-2">
                <span className="text-[9px] uppercase font-bold tracking-wider">Destino Clínico Asignado</span>
                <span className="text-sm font-black tracking-tight">{currentPatient.destino}</span>
                <span className="text-[10px]">Médico Responsable: {currentPatient.medico}</span>
              </div>
            )}

            {/* Prescription */}
            {chkRx && currentPatient.receta && currentPatient.receta.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-dashed border-[#111111] pt-2 text-[10px] my-1.5">
                <div className="font-bold text-center uppercase tracking-wider">Receta Médica en Campaña</div>
                {currentPatient.receta.map((item, i) => (
                  <div key={i} className="text-[9px]">{item}</div>
                ))}
              </div>
            )}

            {/* Authentic Scannable QR Code */}
            {chkQr && (
              <div className="flex flex-col items-center justify-center py-2">
                {qrDataUrl ? (
                  <div
                    onClick={() => showPatientDetail(currentPatient)}
                    className="p-1.5 bg-white border-2 border-[#111111] cursor-pointer group relative shadow-xs"
                    title="Haz clic para ver toda la información detallada del paciente"
                  >
                    <img
                      src={qrDataUrl}
                      alt={`Código QR Ticket #${currentPatient.ticket}`}
                      className="w-28 h-28 object-contain transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="bg-black/90 text-white text-[9px] font-mono px-1.5 py-0.5 font-bold uppercase">
                        Ver Ficha
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 bg-[#fafafa] border border-dashed border-[#111111] flex items-center justify-center text-[10px] font-mono">
                    Generando QR...
                  </div>
                )}
                <span className="text-[8px] font-mono tracking-tighter mt-1 opacity-75">
                  SHA256: {currentPatient.hash ?? '8f92-a1b4-7c3e-90df'} • ISO/IEC 18004
                </span>
                <button
                  type="button"
                  onClick={() => showPatientDetail(currentPatient)}
                  className="mt-1 text-[9px] text-primary hover:underline font-mono font-bold cursor-pointer"
                >
                  [ Ver Ficha Médica Completa ]
                </button>
              </div>
            )}

            {/* Footer Bilingual Instructions */}
            <div className="text-center flex flex-col gap-1 text-[9px] pt-1">
              <div className="font-bold italic">
                "Allillanchu kashanki? Presente este ticket en puerta del box."
              </div>
              <div className="text-[8px] opacity-75">
                Guarde su comprobante para recoger medicamentos en botiquín comunal.
              </div>
              <div className="text-[7.5px] text-gray-700 uppercase leading-snug mt-1 border-t border-dotted border-gray-400 pt-1">
                {branding.exportFooterLegal}
              </div>
              <div className="w-full border-b border-dashed border-[#111111] my-1" />
              <div className="text-[8px] font-mono uppercase tracking-widest text-[#333333]">
                -- CORTE AUTOMÁTICO ESC/POS GS V 0 --
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
