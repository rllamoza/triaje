import { useState } from 'react'
import { useBrandingStore } from '../../store/brandingStore'

export default function TicketPage() {
  const branding = useBrandingStore()
  const ticketNumber = 'T-104'
  const paciente = 'QUISPE CONDORI, JUAN'
  const dni = '42918274'
  const edad = '54'
  const comunidad = 'RUMICHACA SECTOR ALTO'
  const destino = 'CONSULTORIO 1 (MEDICINA GENERAL)'
  const medico = 'Dr. M. Huamán Quispe'

  // Checkboxes
  const [chkQueue, setChkQueue] = useState(true)
  const [chkVitals, setChkVitals] = useState(true)
  const [chkDestino, setChkDestino] = useState(true)
  const [chkRx, setChkRx] = useState(true)
  const [chkQr, setChkQr] = useState(true)

  const [printStatus, setPrintStatus] = useState<string | null>(null)

  const handlePrint = () => {
    setPrintStatus('Enviando comando ESC/POS vía Bluetooth a BT-POS-01...')
    setTimeout(() => {
      setPrintStatus('¡Ticket impreso y cortado exitosamente!')
      setTimeout(() => setPrintStatus(null), 3000)
    }, 1200)
  }

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

        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant bg-surface px-3 py-2 border border-surface-container-high">
          <span className="material-symbols-outlined text-[18px] text-tertiary">print</span>
          <span>Baudrate: 115200 (8N1) • Papel: 58mm</span>
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
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-on-surface">
                1. Paciente Seleccionado
              </span>
              <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[11px] font-mono font-bold">
                Triaje Completado
              </span>
            </div>

            {/* Fast Search Bar */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                search
              </span>
              <input
                className="w-full h-10 pl-10 pr-20 bg-surface-container-low text-xs font-mono text-on-surface border border-surface-container-high focus:outline-none focus:border-primary"
                placeholder="Buscar por DNI o #Ticket..."
                type="text"
                defaultValue="42918274 - Juan Quispe Condori (#T-104)"
              />
              <button className="absolute right-1 top-1 h-8 px-3 bg-surface text-on-surface text-xs font-mono border border-surface-container-high hover:bg-surface-container transition-colors cursor-pointer rounded-none">
                Buscar
              </button>
            </div>

            {/* Active Loaded Record Card */}
            <div className="bg-surface-container-low p-4 border border-surface-container-high flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-on-surface">{paciente}</span>
                  <span className="px-2 py-0.5 bg-surface-container-high text-[11px] font-mono font-semibold text-on-surface">
                    {edad} años
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  DNI: {dni} • Procedencia: {comunidad}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-[#f1c21b] text-[#161616] font-bold">
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    TRIAGE PRIORIDAD II (URGENCIA)
                  </span>
                  <span className="text-[11px] font-mono text-error font-bold">
                    ALERGIA: Penicilina
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end justify-center sm:pl-4">
                <span className="text-xs font-mono text-secondary">Código Turno</span>
                <span className="text-3xl font-mono font-bold text-primary">#{ticketNumber}</span>
              </div>
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
                  <span className="font-bold text-on-surface">Código QR P2P Offline</span>
                  <span className="text-[11px] text-secondary">
                    Firma digital SHA-256 para validación sin conexión entre estaciones.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Typography, Density & Language Customization */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-on-surface">
              3. Tipografía Térmica y Localización
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-on-surface-variant font-medium">Idioma de Indicaciones Comunitarias</label>
                <select className="h-10 px-3 bg-surface-container border border-surface-container-high text-on-surface focus:outline-none focus:border-primary">
                  <option value="bilingual">Castellano + Quechua Collao</option>
                  <option value="es">Solo Castellano</option>
                  <option value="qu">Solo Quechua</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-on-surface-variant font-medium">Modo de Fuente Primaria ESC/POS</label>
                <select className="h-10 px-3 bg-surface-container border border-surface-container-high text-on-surface focus:outline-none focus:border-primary">
                  <option value="fontA">Font A (12x24 dots - 48 cols estándar)</option>
                  <option value="fontB">Font B (9x17 dots - 64 cols condensada)</option>
                </select>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer pt-1">
              <input defaultChecked type="checkbox" className="w-4 h-4 accent-primary rounded-none" />
              <span className="text-on-surface">Invertir Fondo/Texto en Alertas Críticas (Negativo ESC 45 1)</span>
            </label>
          </div>

          {/* Large Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 h-12 bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-xs font-mono font-bold flex items-center justify-center gap-2 tracking-wider transition-colors shadow-xs cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>IMPRIMIR TICKET TÉRMICO (ENTER)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-12 px-4 bg-surface hover:bg-surface-container text-on-surface text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-colors border border-surface-container-high cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-[18px]">replay</span>
              <span>Reimprimir #T-103</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="h-12 px-4 bg-surface hover:bg-surface-container text-on-surface text-xs font-mono flex items-center justify-center gap-2 transition-colors border border-surface-container-high cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-[18px]">receipt</span>
              <span>Test Diagnóstico</span>
            </button>
          </div>

          {/* Hardware Alert Note */}
          <div className="p-3 bg-surface-container text-xs font-mono text-on-surface-variant flex items-center gap-3 border border-surface-container-high">
            <span className="material-symbols-outlined text-primary text-[18px]">info</span>
            <span>
              Impresión directa por comandos crudos ESC/POS sin buffer del sistema operativo. Sin retrasos en campo desconectado.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Thermal Receipt Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-[#fafafa] text-[#111111] p-6 shadow-lg border border-[#e0e0e0] font-mono select-none">
            {/* Header */}
            <div className="text-center flex flex-col items-center">
              {branding.selectedExportLogo !== 'ninguno' && (
                <div className="flex justify-center mb-1.5">
                  {branding.selectedExportLogo === 'ticket_personalizado' && branding.ticketLogoUrl ? (
                    <img src={branding.ticketLogoUrl} alt="Logo Ticket" className="h-9 w-auto object-contain filter grayscale" />
                  ) : branding.selectedExportLogo === 'isotipo' && branding.isotipoUrl ? (
                    <img src={branding.isotipoUrl} alt="Isotipo Ticket" className="h-9 w-auto object-contain filter grayscale" />
                  ) : branding.logoUrl ? (
                    <img src={branding.logoUrl} alt="Logo Principal" className="h-8 w-auto object-contain filter grayscale" />
                  ) : null}
                </div>
              )}
              <div className="text-xs font-black tracking-tight uppercase">{branding.exportHeader}</div>
              <div className="text-[9px] uppercase font-semibold mt-0.5 text-gray-800">
                {branding.exportSubheader}
              </div>
              <div className="text-[10px]">Puesto Comunal Rumichaca - Urubamba, Cusco</div>
              <div className="text-[9px] opacity-80 mt-0.5">Nodo Offline: CUS-VALLE-04 • ESC/POS Native</div>
              <div className="w-full border-b border-dashed border-[#111111] my-2" />
            </div>

            {/* Big Ticket Box */}
            {chkQueue && (
              <div className="flex flex-col items-center py-2 bg-[#f0f0f0] p-2 my-1">
                <div className="text-[10px] tracking-widest font-semibold">NÚMERO DE ATENCIÓN EN COLA</div>
                <div className="text-3xl font-black tracking-tighter my-0.5 text-[#000000]">
                  # {ticketNumber}
                </div>
                <div className="text-[9px] font-semibold">HORA EMISIÓN: 12/MAY/2025 - 09:20:14</div>
              </div>
            )}

            {/* Priority Indicator */}
            <div className="bg-[#111111] text-[#ffffff] px-2 py-1.5 text-center flex flex-col gap-0.5 my-1.5">
              <div className="text-[11px] font-black tracking-widest">
                *** PRIORIDAD II - URGENCIA ***
              </div>
              <div className="text-[9px] font-mono opacity-90">TIEMPO ESTIMADO ESPERA: ~12 MINUTOS</div>
            </div>

            {/* Patient Demographic */}
            <div className="flex flex-col gap-0.5 text-[10px] my-2">
              <div className="flex justify-between font-semibold">
                <span>PACIENTE:</span>
                <span className="font-bold">{paciente}</span>
              </div>
              <div className="flex justify-between">
                <span>DNI / HISTORIA:</span>
                <span>{dni} / HC-2025-089</span>
              </div>
              <div className="flex justify-between">
                <span>EDAD / SEXO:</span>
                <span>{edad} AÑOS / MASCULINO</span>
              </div>
              <div className="flex justify-between">
                <span>COMUNIDAD:</span>
                <span>{comunidad}</span>
              </div>
            </div>

            {/* Severe Allergy Negative Box */}
            <div className="bg-[#111111] text-[#ffffff] px-2 py-1 text-center font-bold text-[10px] tracking-tight my-1.5">
              ! ! ! ALERTA SEVERA: ALERGIA PENICILINA ! ! !
            </div>

            {/* Vitals Summary Strip */}
            {chkVitals && (
              <div className="flex flex-col gap-1 p-2 bg-[#eeeeee] text-[10px] my-1.5">
                <div className="text-[9px] font-bold uppercase tracking-wider text-center border-b border-dashed border-[#888888] pb-1 mb-1">
                  Constantes Vitales de Triaje
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  <div>PA: <strong className="font-bold">145/95 mmHg</strong></div>
                  <div>FC: <strong className="font-bold">88 lpm</strong></div>
                  <div>TEMP: <strong className="font-bold">38.6 °C</strong></div>
                  <div>SpO2: <strong className="font-bold">92% (Altitud)</strong></div>
                  <div>FR: <strong className="font-bold">20 rpm</strong></div>
                  <div>GLUC: <strong className="font-bold">110 mg/dL</strong></div>
                </div>
              </div>
            )}

            {/* Destination Box */}
            {chkDestino && (
              <div className="p-2 border-2 border-[#111111] text-center flex flex-col my-2">
                <span className="text-[9px] uppercase font-bold tracking-wider">Destino Clínico Asignado</span>
                <span className="text-sm font-black tracking-tight">{destino}</span>
                <span className="text-[10px]">Médico Responsable: {medico}</span>
              </div>
            )}

            {/* Prescription */}
            {chkRx && (
              <div className="flex flex-col gap-1 border-t border-dashed border-[#111111] pt-2 text-[10px] my-1.5">
                <div className="font-bold text-center uppercase tracking-wider">Receta Médica en Campaña</div>
                <div className="text-[9px]">1. Paracetamol 500mg - 1 tab c/8h x 3 días.</div>
                <div className="text-[9px]">2. Naproxeno 550mg - 1 tab c/12h x 4 días.</div>
              </div>
            )}

            {/* Simulated QR code */}
            {chkQr && (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="w-24 h-24 bg-[#111111] p-1.5 flex items-center justify-center">
                  <div className="w-full h-full bg-[#fafafa] p-1 grid grid-cols-5 grid-rows-5 gap-0.5">
                    <div className="bg-[#111111] col-span-2 row-span-2" />
                    <div className="bg-[#fafafa]" />
                    <div className="bg-[#111111] col-span-2 row-span-2" />
                    <div className="bg-[#111111]" />
                    <div className="bg-[#fafafa]" />
                    <div className="bg-[#111111]" />
                    <div className="bg-[#111111] col-span-2 row-span-2" />
                    <div className="bg-[#111111]" />
                    <div className="bg-[#fafafa]" />
                  </div>
                </div>
                <span className="text-[8px] font-mono tracking-tighter mt-1 opacity-75">
                  SHA256: 8f92-a1b4-7c3e-90df • DESCONECTADO
                </span>
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
