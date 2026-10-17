import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { useBrandingStore, getEffectiveTicketLogo } from '../../store/brandingStore'
import { useScannerStore } from '../../store/scannerStore'
import { PATIENT_DATABASE, generatePatientQrPayload, type DetailedPatient } from '../../services/patientRegistry'
import { usePrinterStatus, usePrintDirectTicket } from '../../api/hooks'
import { detectDevice, printThermalElement } from '../../utils/printEngine'

export default function TicketPage() {
  const branding = useBrandingStore()
  const effectiveLogo = getEffectiveTicketLogo(branding)
  const { openScanner, showPatientDetail } = useScannerStore()

  // Consulta de impresoras reales conectadas
  const { data: printerInfo, isLoading: loadingPrinters, refetch: refetchPrinters } = usePrinterStatus()
  const printDirectMutation = usePrintDirectTicket()

  // Selección y modo de Impresora
  const [selectedPrinter, setSelectedPrinter] = useState<string>('EPSON TM-T88V Receipt')
  const [printerMode, setPrinterMode] = useState<'usb' | 'network'>('usb')
  const [printerIp, setPrinterIp] = useState<string>('')
  const [printerPort, setPrinterPort] = useState<number>(9100)
  const [showPrinterSettings, setShowPrinterSettings] = useState<boolean>(false)
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm')

  // Patient Selection
  const [currentPatient, setCurrentPatient] = useState<DetailedPatient>(PATIENT_DATABASE[0])
  const [searchInput, setSearchInput] = useState('42918274')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  // Checkboxes de Secciones Clínicas
  const [chkQueue, setChkQueue] = useState(true)
  const [chkVitals, setChkVitals] = useState(true)
  const [chkDestino, setChkDestino] = useState(true)
  const [chkRx, setChkRx] = useState(true)
  const [chkQr, setChkQr] = useState(true)

  const [printStatus, setPrintStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null)

  // Sincronizar impresora recomendada
  useEffect(() => {
    if (printerInfo?.recommended_printer) {
      setSelectedPrinter(printerInfo.recommended_printer)
    }
  }, [printerInfo])

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

  // Detección automática del dispositivo cliente (Windows, Android, iOS)
  const device = detectDevice()

  // Impresión Inteligente con Detección Automática de Dispositivo
  const handlePrint = async () => {
    // 1. SI ES SMARTPHONE (Android / iPhone / Tablet)
    if (device.isMobile) {
      setPrintStatus({
        type: 'info',
        message: `📱 ${device.deviceType} detectado: Abriendo driver térmico del dispositivo...`,
      })
      const success = await printThermalElement('thermal-receipt-printable', paperWidth)
      setPrintStatus({
        type: success ? 'success' : 'error',
        message: success
          ? `¡Ticket enviado exitosamente al driver térmico de ${device.deviceType}!`
          : `No se pudo abrir el driver de impresión en ${device.deviceType}.`,
      })
      setTimeout(() => setPrintStatus(null), 5000)
      return
    }

    // 2. SI ES WINDOWS PC
    setPrintStatus({
      type: 'info',
      message: `💻 Windows detectado: Conectando con driver Epson TM-T88...`,
    })

    const payload = {
      ticket: currentPatient.ticket,
      paciente: currentPatient.paciente,
      dni: currentPatient.dni,
      edad: currentPatient.edad,
      sexo: currentPatient.sexo,
      comunidad: currentPatient.comunidad,
      telefono: currentPatient.telefono,
      seguro: currentPatient.seguro,
      motivo: currentPatient.motivo,
      prioridadLabel: currentPatient.prioridadLabel,
      prioridad: currentPatient.prioridad,
      espera: currentPatient.espera,
      hora: currentPatient.hora,
      fecha: currentPatient.fecha || new Date().toLocaleDateString('es-PE'),
      alergias: currentPatient.alergias,
      destino: currentPatient.destino,
      medico: currentPatient.medico,
      vitals: currentPatient.vitals,
      receta: currentPatient.receta,
      hash: currentPatient.hash,
      qrPayload: generatePatientQrPayload(currentPatient),
      header: branding.exportHeader || 'ONG SEMILLA - ASISTENCIA MEDICA',
      subheader: branding.exportSubheader || 'RED DE ATENCION CLINICA ITINERANTE',
      footerLegal: branding.exportFooterLegal || 'DOCUMENTO CLINICO DE CAMPO - VALIDEZ ASISTENCIAL',
      chkQueue,
      chkVitals,
      chkDestino,
      chkRx,
      chkQr,
    }

    // Verificar si estamos conectados a servidor local o remoto
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    // Si estamos en red local con backend local, intentar spooler nativo de Windows primero
    if (isLocalhost && printerMode === 'usb') {
      try {
        const res = await printDirectMutation.mutateAsync({
          payload,
          printer_name: selectedPrinter,
        })

        if (res && res.success) {
          setPrintStatus({
            type: 'success',
            message: res.message || `¡Ticket impreso y cortado con éxito en ${res.printer || selectedPrinter}!`,
          })
          setTimeout(() => setPrintStatus(null), 6000)
          return
        }
      } catch (err: any) {
        console.warn('Spooler local de Windows no disponible, pasando a driver directo del sistema...', err)
      }
    }

    // Impresión por Red IP si se seleccionó ese modo
    if (printerMode === 'network' && printerIp) {
      try {
        const res = await printDirectMutation.mutateAsync({
          payload,
          printer_ip: printerIp,
          printer_port: printerPort,
        })
        if (res && res.success) {
          setPrintStatus({
            type: 'success',
            message: res.message || `¡Ticket enviado por Red a ${printerIp}:${printerPort}!`,
          })
          setTimeout(() => setPrintStatus(null), 6000)
          return
        }
      } catch (err: any) {
        console.warn('Fallo envío por red:', err)
      }
    }

    // 3. ENRUTAMIENTO INMEDIATO AL CONTROLADOR LOCAL DE WINDOWS (Garantiza impresión en cPanel o sin spooler)
    setPrintStatus({
      type: 'info',
      message: `💻 Abriendo driver local de Windows (${selectedPrinter || 'Epson TM-T88'})...`,
    })
    const ok = await printThermalElement('thermal-receipt-printable', paperWidth)
    setPrintStatus({
      type: ok ? 'success' : 'error',
      message: ok
        ? `¡Ticket enviado inmediatamente al driver de Windows (${selectedPrinter})!`
        : `Verifique la conexión con el driver de la impresora.`,
    })
    setTimeout(() => setPrintStatus(null), 5000)
  }

  // Impresión Inmediata del Dispositivo (Aislada a 80mm/58mm)
  const handleWebPrint = async () => {
    await printThermalElement('thermal-receipt-printable', paperWidth)
  }

  const isRojo = currentPatient.prioridad === 'rojo'
  const isAmarillo = currentPatient.prioridad === 'amarillo'
  const isT88Connected = printerInfo?.t88_detected ?? true

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Header Contextual Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container-high print:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-primary-container text-on-primary-fixed">
              POS-EPSON T88
            </span>

            {/* Badge de Impresora Detectada */}
            <span className={`px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1.5 border ${
              isT88Connected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isT88Connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-semibold">{selectedPrinter}</span>
              <span className="opacity-75 font-mono text-[10px]">
                ({printerInfo?.default_port || 'ESDPRT002 USB'}) • {printerInfo?.status_label || 'Listo'}
              </span>
            </span>

            <button
              type="button"
              onClick={() => setShowPrinterSettings(!showPrinterSettings)}
              className="px-2 py-0.5 text-[11px] font-mono text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>{showPrinterSettings ? 'Ocultar Opciones' : 'Configurar Salida'}</span>
            </button>
          </div>

          <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-on-surface">
            Emisión de Ticket Térmico <span className="font-semibold text-primary">&amp; Formato Clínico ESC/POS</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Ancho de Papel */}
          <div className="flex items-center bg-surface-container-low border border-surface-container-high p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                paperWidth === '80mm'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
              title="80mm: Ancho oficial Epson TM-T88V"
            >
              80mm (Epson T88)
            </button>
            <button
              type="button"
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                paperWidth === '58mm'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
              title="58mm: Formato móvil o portátil"
            >
              58mm (Móvil)
            </button>
          </div>

          <button
            type="button"
            onClick={openScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            title="Escanear cualquier ticket o QR de paciente"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            <span>Escanear QR</span>
          </button>

          <button
            type="button"
            onClick={handleWebPrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-container text-on-surface text-xs font-mono border border-surface-container-high transition-colors cursor-pointer"
            title="Imprimir vía diálogo estándar del navegador"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">print</span>
            <span>Imprimir Web (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Panel de Configuración de Impresora (Desplegable) */}
      {showPrinterSettings && (
        <div className="mb-6 p-4 bg-surface border border-surface-container-high rounded-none flex flex-col gap-3 shadow-md print:hidden">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
            <span className="text-xs font-mono uppercase font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">settings</span>
              Configuración de Dispositivo de Impresión
            </span>
            <button
              type="button"
              onClick={() => refetchPrinters()}
              disabled={loadingPrinters}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[14px] ${loadingPrinters ? 'animate-spin' : ''}`}>sync</span>
              <span>Actualizar Dispositivos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Modo de conexión */}
            <div className="flex flex-col gap-1.5">
              <span className="text-secondary font-semibold">Tipo de Comunicación:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="usb"
                    checked={printerMode === 'usb'}
                    onChange={() => setPrinterMode('usb')}
                    className="accent-primary"
                  />
                  <span>USB / Driver Local (Windows)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    value="network"
                    checked={printerMode === 'network'}
                    onChange={() => setPrinterMode('network')}
                    className="accent-primary"
                  />
                  <span>Red Ethernet/WiFi (Socket 9100)</span>
                </label>
              </div>
            </div>

            {/* Impresora seleccionada en Windows */}
            {printerMode === 'usb' ? (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-secondary font-semibold">Impresora del Sistema:</span>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="h-9 px-3 bg-surface-container-low border border-surface-container-high text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
                >
                  {printerInfo?.printers?.map((p: any) => (
                    <option key={p.id} value={p.name}>
                      {p.name} {p.is_t88 ? '★ [EPSON T88 RECOMENDADA]' : ''} ({p.port}) - {p.status_label}
                    </option>
                  )) || (
                    <option value="EPSON TM-T88V Receipt">EPSON TM-T88V Receipt (ESDPRT002)</option>
                  )}
                </select>
              </div>
            ) : (
              /* Configuración de Red IP */
              <div className="flex items-center gap-2 md:col-span-2">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-secondary font-semibold">Dirección IP de Impresora:</span>
                  <input
                    type="text"
                    value={printerIp}
                    onChange={(e) => setPrinterIp(e.target.value)}
                    placeholder="ej: 192.168.1.150"
                    className="h-9 px-3 bg-surface-container-low border border-surface-container-high text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="w-24 flex flex-col gap-1">
                  <span className="text-secondary font-semibold">Puerto TCP:</span>
                  <input
                    type="number"
                    value={printerPort}
                    onChange={(e) => setPrinterPort(Number(e.target.value))}
                    className="h-9 px-3 bg-surface-container-low border border-surface-container-high text-on-surface text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner de Estado de Impresión */}
      {printStatus && (
        <div
          className={`p-3.5 mb-6 text-xs flex items-center justify-between gap-2 border font-semibold shadow-xs transition-all print:hidden ${
            printStatus.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
              : printStatus.type === 'error'
              ? 'bg-error-container text-on-error-container border-error/50'
              : 'bg-primary-container text-on-primary-container border-primary/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {printStatus.type === 'success' ? 'check_circle' : printStatus.type === 'error' ? 'error' : 'print'}
            </span>
            <span>{printStatus.message}</span>
          </div>

          {printStatus.type === 'error' && (
            <button
              type="button"
              onClick={handleWebPrint}
              className="px-2.5 py-1 bg-surface text-on-surface text-[11px] font-mono border border-surface-container-high hover:bg-surface-container cursor-pointer"
            >
              Usar Diálogo del Sistema (Ctrl+P)
            </button>
          )}
        </div>
      )}

      {/* Main Workspace Split: Configurator vs Real-Time Thermal Receipt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Configurator, Patient Selection & Fast Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6 print:hidden">
          {/* Active Patient Selector */}
          <div className="bg-surface p-6 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                1. Selección de Beneficiario &amp; Turno
              </span>
              <span className="px-2 py-0.5 bg-tertiary-container text-on-tertiary-container text-[11px] font-mono font-bold">
                Ficha Validada
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
              <span className="text-[11px] font-mono text-on-surface-variant mr-1">Casos Rápidos:</span>
              {PATIENT_DATABASE.map((p) => (
                <button
                  key={p.ticket}
                  type="button"
                  onClick={() => {
                    setCurrentPatient(p)
                    setSearchInput(p.dni)
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentPatient.ticket === p.ticket
                      ? 'bg-primary text-on-primary border-primary font-bold'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container border-surface-container-high'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    p.prioridad === 'rojo' ? 'bg-error' : p.prioridad === 'amarillo' ? 'bg-[#f1c21b]' : 'bg-tertiary'
                  }`} />
                  <span>#{p.ticket} • {p.paciente.split(',')[0]}</span>
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
                  <span className="px-1.5 py-0.5 bg-surface-container text-[11px] font-mono text-secondary">
                    {currentPatient.sexo === 'M' ? 'Masc' : 'Fem'}
                  </span>
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  DNI: <strong>{currentPatient.dni}</strong> • Seguro: <strong>{currentPatient.seguro}</strong>
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  Procedencia: {currentPatient.comunidad}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 font-bold ${
                    isRojo ? 'bg-error text-on-error' : isAmarillo ? 'bg-[#f1c21b] text-[#161616]' : 'bg-tertiary text-on-tertiary'
                  }`}>
                    <span className="material-symbols-outlined text-[14px]">flag</span>
                    {currentPatient.prioridadLabel}
                  </span>
                  {currentPatient.alergias && currentPatient.alergias.toLowerCase() !== 'ninguna' && (
                    <span className="text-[11px] font-mono bg-error/15 text-error px-2 py-0.5 font-bold flex items-center gap-1 border border-error/30">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      {currentPatient.alergias}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center sm:pl-4 border-t sm:border-t-0 sm:border-l border-surface-container-high pt-2 sm:pt-0">
                <span className="text-xs font-mono text-secondary">Código Turno</span>
                <span className="text-3xl font-mono font-black text-primary">#{currentPatient.ticket}</span>
                <span className="text-[11px] font-mono text-on-surface-variant mt-0.5">~{currentPatient.espera} espera</span>
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
              2. Secciones a Incluir en Ticket Térmico (Comandos ESC/POS Epson T88)
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
                  <span className="font-bold text-on-surface">Cabecera de Cola &amp; Turno Gigante</span>
                  <span className="text-[11px] text-secondary">Identidad comunal, número de turno 4x y hora.</span>
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
                  <span className="font-bold text-on-surface">Constantes Vitales de Triaje</span>
                  <span className="text-[11px] text-secondary">PA, FC, Temp, SpO2 altitudinal, FR y Glucemia.</span>
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
                  <span className="text-[11px] text-secondary">Consultorio, Box y doctor responsable con CMP.</span>
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
                  <span className="text-[11px] text-secondary">Posología y medicamentos prescritos para botiquín.</span>
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
                    <span className="font-bold text-on-surface">Código QR ISO/IEC 18004 Nítido</span>
                    <span className="px-1.5 py-0.2 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold">
                      Comando Epson GS ( k
                    </span>
                  </div>
                  <span className="text-[11px] text-secondary">
                    Contiene la ficha médica codificada. Escaneable por cámaras y lectores de código de barras.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Smart Device Routing Indicator */}
          <div className="p-3 bg-surface-container border-l-4 border-primary flex items-center justify-between text-xs font-mono shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[22px]">
                {device.isMobile ? 'smartphone' : 'laptop_windows'}
              </span>
              <div>
                <span className="font-bold text-on-surface block">
                  Dispositivo detectado: {device.deviceType}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Driver sugerido: {device.recommendedDriver}
                </span>
              </div>
            </div>
            <span className="px-2 py-1 bg-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider">
              Enrutamiento Directo
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              disabled={printDirectMutation.isPending}
              type="button"
              className="flex-1 py-3.5 px-6 bg-primary text-on-primary font-mono font-bold text-sm tracking-wide uppercase hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer rounded-none disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[20px] ${printDirectMutation.isPending ? 'animate-spin' : ''}`}>
                {printDirectMutation.isPending ? 'hourglass_top' : device.isMobile ? 'smartphone' : 'print'}
              </span>
              <span>
                {printDirectMutation.isPending
                  ? 'Procesando Impresión...'
                  : device.isMobile
                  ? `Imprimir Ticket (${device.deviceType})`
                  : `Imprimir en ${selectedPrinter}`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => showPatientDetail(currentPatient)}
              className="py-3.5 px-6 bg-surface hover:bg-surface-container text-on-surface font-mono font-bold text-sm border border-surface-container-high transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">clinical_notes</span>
              <span>Ver Ficha Detallada</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Stylized Thermal Receipt Preview (Epson TM-T88 / 80mm & 58mm Emulation) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 mb-2 text-xs font-mono text-on-surface-variant print:hidden">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">receipt</span>
              VISTA PREVIA TÉRMICA ESTILIZADA ({paperWidth})
            </span>
            <span className="text-secondary">ESCALA REAL 1:1</span>
          </div>

          {/* Recuadro de Papel Térmico con Textura Real y Bordes Serrados de Corte */}
          <div
            id="thermal-receipt-printable"
            style={{
              width: paperWidth === '80mm' ? '360px' : '300px',
            }}
            className="bg-[#ffffff] text-[#000000] px-5 py-6 shadow-2xl border-2 border-[#111111] font-mono text-xs font-semibold select-none relative transition-all duration-300 antialiased print:shadow-none print:border-none print:m-0 print:p-2 print:w-full print:text-black"
          >
            {/* Borde dentado superior de corte térmico */}
            <div className="w-full h-1 bg-[radial-gradient(circle,#000000_1px,transparent_1px)] bg-[size:6px_6px] mb-3 print:hidden" />

            {/* 1. Encabezado Médico e Identidad Institucional */}
            <div className="text-center flex flex-col items-center gap-1 border-b-2 border-[#000000] pb-3">
              {effectiveLogo ? (
                <img
                  src={effectiveLogo}
                  alt="Logo Ticket"
                  className="h-12 w-auto max-w-[170px] object-contain mb-1 filter grayscale contrast-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-[#000000] flex items-center justify-center mb-1 font-black text-base text-black">
                  +
                </div>
              )}
              <div className="font-black text-lg tracking-tight leading-none uppercase text-black">
                {branding.exportHeader || 'ONG SEMILLA - ASISTENCIA MEDICA'}
              </div>
              <div className="text-xs font-bold tracking-wide uppercase leading-tight text-black mt-0.5">
                {branding.exportSubheader || 'RED DE ATENCION CLINICA ITINERANTE'}
              </div>
              <div className="text-[11px] font-bold tracking-wider text-black mt-0.5">
                PUESTO DE SALUD Y TRIAJE DE CAMPO
              </div>
              <div className="text-[10px] tracking-widest mt-1 font-black text-black">
                ========================================
              </div>
            </div>

            {/* 2. Número de Turno Gigante en Recuadro Estilizado */}
            {chkQueue && (
              <div className="my-3 p-3 border-2 border-dashed border-[#000000] bg-[#ffffff] text-center flex flex-col items-center">
                <span className="text-xs font-black tracking-widest text-[#000000] uppercase">
                  COMPROBANTE DE ATENCIÓN EN COLA
                </span>
                <span className="text-5xl font-black tracking-tighter my-1 text-[#000000]">
                  #{currentPatient.ticket}
                </span>
                <div className="flex items-center justify-between w-full text-[11px] font-bold text-[#000000] pt-1.5 border-t-2 border-dotted border-[#000000]">
                  <span>EMISIÓN: {currentPatient.fecha || '19/SEP/2026'}</span>
                  <span>HORA: {currentPatient.hora}</span>
                </div>
              </div>
            )}

            {/* 3. Indicador Manchester de Prioridad (Bloque Invertido Blanco sobre Negro) */}
            <div className="bg-[#000000] text-[#ffffff] px-3 py-2.5 text-center flex flex-col gap-0.5 my-2">
              <div className="text-sm font-black tracking-wider text-white">
                ★ ★ ★ {currentPatient.prioridadLabel.toUpperCase()} ★ ★ ★
              </div>
              <div className="text-[11px] font-mono font-bold flex items-center justify-center gap-2 text-white">
                <span>TIEMPO APROX. ESPERA:</span>
                <strong className="underline text-yellow-300">~{currentPatient.espera}</strong>
              </div>
            </div>

            {/* 4. Tarjeta Demográfica del Beneficiario */}
            <div className="border-2 border-[#000000] p-3 my-2 bg-[#ffffff] text-xs font-bold text-black">
              <div className="text-xs font-black uppercase tracking-wider text-[#000000] border-b-2 border-[#000000] pb-1 mb-2 flex justify-between">
                <span>FILIACIÓN DEL PACIENTE</span>
                <span>HC-2026-089</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-black text-[13px] text-black">
                  <span>PACIENTE:</span>
                  <span className="text-right truncate max-w-[210px]">{currentPatient.paciente}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span>DNI / DOCUMENTO:</span>
                  <strong className="font-mono font-black text-black">{currentPatient.dni}</strong>
                </div>
                <div className="flex justify-between text-black">
                  <span>EDAD / SEXO:</span>
                  <span className="font-bold">{currentPatient.edad.toUpperCase()} • {currentPatient.sexo === 'M' ? 'MASCULINO' : 'FEMENINO'}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span>SEGURO DE SALUD:</span>
                  <strong className="truncate max-w-[190px] font-black">{currentPatient.seguro}</strong>
                </div>
                <div className="flex justify-between text-black">
                  <span>PROCEDENCIA:</span>
                  <span className="truncate max-w-[190px] text-right font-bold">{currentPatient.comunidad}</span>
                </div>
                {currentPatient.telefono && (
                  <div className="flex justify-between text-black">
                    <span>TELÉFONO CONTACTO:</span>
                    <span className="font-mono font-bold">{currentPatient.telefono}</span>
                  </div>
                )}
                {currentPatient.motivo && (
                  <div className="pt-1.5 mt-1 border-t-2 border-dotted border-[#000000] flex flex-col text-black">
                    <span className="font-black text-xs text-black">MOTIVO CONSULTA:</span>
                    <span className="font-bold leading-tight">{currentPatient.motivo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Alerta Médica de Alergias Críticas (Negativo de Alto Contraste) */}
            {currentPatient.alergias && currentPatient.alergias.toLowerCase() !== 'ninguna' && (
              <div className="bg-[#000000] text-[#ffffff] p-2.5 text-center my-2 border-2 border-red-600">
                <div className="text-xs font-black tracking-wider text-red-400">
                  ! ! ! ALERTA MÉDICA: ALERGIA SEVERA ! ! !
                </div>
                <div className="text-xs font-black font-mono mt-0.5 uppercase tracking-wide text-white">
                  {currentPatient.alergias}
                </div>
              </div>
            )}

            {/* 6. Constantes Vitales de Triaje (Rejilla Estilizada) */}
            {chkVitals && (
              <div className="p-3 bg-[#ffffff] border-2 border-[#000000] my-2 text-xs font-bold text-black">
                <div className="text-xs font-black uppercase tracking-wider text-center border-b-2 border-[#000000] pb-1 mb-2 text-black">
                  CONSTANTES VITALES DE TRIAJE
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                    <span className="font-black">PA:</span>
                    <strong className="font-black font-mono">{currentPatient.vitals.pa}</strong>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                    <span className="font-black">FC:</span>
                    <strong className="font-black font-mono">{currentPatient.vitals.fc}</strong>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                    <span className="font-black">TEMP:</span>
                    <strong className="font-black font-mono">{currentPatient.vitals.temp}</strong>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                    <span className="font-black">SpO2:</span>
                    <strong className="font-black font-mono">{currentPatient.vitals.spo2}</strong>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                    <span className="font-black">FR:</span>
                    <strong className="font-black font-mono">{currentPatient.vitals.fr}</strong>
                  </div>
                  <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                    <span className="font-black">GLUC:</span>
                    <strong className="font-black font-mono">{currentPatient.vitals.gluc}</strong>
                  </div>
                  {currentPatient.vitals.peso && (
                    <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                      <span className="font-black">PESO:</span>
                      <strong className="font-mono font-black">{currentPatient.vitals.peso}</strong>
                    </div>
                  )}
                  {currentPatient.vitals.talla && (
                    <div className="flex justify-between border-b border-dotted border-[#000000] pb-0.5">
                      <span className="font-black">TALLA:</span>
                      <strong className="font-mono font-black">{currentPatient.vitals.talla}</strong>
                    </div>
                  )}
                  {currentPatient.vitals.imc && (
                    <div className="col-span-2 flex justify-between pt-0.5">
                      <span className="font-black">IMC / ESTADO:</span>
                      <strong className="font-mono font-black">{currentPatient.vitals.imc}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. Destino Clínico y Consultorio Asignado */}
            {chkDestino && (
              <div className="p-3 border-2 border-[#000000] text-center flex flex-col my-2 bg-[#ffffff]">
                <span className="text-[11px] uppercase font-black tracking-widest text-[#000000]">
                  DESTINO CLÍNICO ASIGNADO
                </span>
                <span className="text-base font-black tracking-tight text-[#000000] my-0.5 uppercase">
                  {currentPatient.destino}
                </span>
                <span className="text-xs font-bold text-[#000000] border-t-2 border-dotted border-[#000000] pt-1 mt-1">
                  Médico Responsable: {currentPatient.medico}
                </span>
              </div>
            )}

            {/* 8. Receta Médica y Plan Farmacológico */}
            {chkRx && currentPatient.receta && currentPatient.receta.length > 0 && (
              <div className="p-3 border-2 border-dashed border-[#000000] my-2 text-xs font-bold bg-[#ffffff] text-black">
                <div className="font-black text-center uppercase tracking-wider border-b-2 border-dotted border-[#000000] pb-1 mb-1.5 text-black">
                  RECETA MÉDICA &amp; PLAN FARMACOLÓGICO
                </div>
                <div className="flex flex-col gap-1.5">
                  {currentPatient.receta.map((item, i) => (
                    <div key={i} className="text-xs leading-snug flex items-start gap-1 text-black font-bold">
                      <span className="font-black">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-center font-bold text-black mt-2 pt-1 border-t-2 border-dotted border-[#000000]">
                  * Reclamar medicamentos presentando este ticket en botiquín comunal *
                </div>
              </div>
            )}

            {/* 9. Código QR Scannable ISO/IEC 18004 Nítido */}
            {chkQr && (
              <div className="flex flex-col items-center justify-center py-3 my-2 border-y-2 border-dashed border-[#000000]">
                <span className="text-xs font-black uppercase tracking-wider mb-1.5 text-[#000000]">
                  FICHA CLÍNICA ELECTRÓNICA (QR)
                </span>
                {qrDataUrl ? (
                  <div
                    onClick={() => showPatientDetail(currentPatient)}
                    className="p-2 bg-white border-2 border-[#000000] cursor-pointer group relative shadow-md"
                    title="Haz clic para ver toda la información detallada del paciente"
                  >
                    <img
                      src={qrDataUrl}
                      alt={`Código QR Ticket #${currentPatient.ticket}`}
                      className="w-28 h-28 object-contain transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="bg-black text-white text-[10px] font-mono px-2 py-0.5 font-black uppercase">
                        Ver Ficha
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 bg-[#ffffff] border-2 border-dashed border-[#000000] flex items-center justify-center text-xs font-mono font-bold">
                    Generando QR...
                  </div>
                )}
                <span className="text-[10px] font-mono font-bold tracking-wider mt-1.5 text-black">
                  HASH: SHA-{currentPatient.hash ?? '8f92-a1b4-7c3e-90df'} • ISO/IEC 18004
                </span>
                <span className="text-[10px] text-black font-bold mt-0.5 text-center">
                  Escaneable por médicos, enfermeras y botiquín
                </span>
              </div>
            )}

            {/* 10. Pie de Página Intercultural & Mensaje Legal */}
            <div className="text-center flex flex-col gap-1 text-[11px] font-bold pt-2 text-black">
              <div className="font-black italic text-xs text-black">
                "Allillanchu kashanki? Presente este ticket en puerta del box."
              </div>
              <div className="text-[10px] font-bold text-black">
                Conserve este comprobante hasta finalizar toda su atención clínica.
              </div>
              <div className="text-[10px] font-black text-black uppercase leading-snug mt-1 border-t-2 border-dotted border-[#000000] pt-1">
                {branding.exportFooterLegal || 'DOCUMENTO MÉDICO DE ASISTENCIA SOCIAL — MINSA / DIRES CUSCO'}
              </div>
              <div className="text-[9px] font-mono font-black text-black uppercase mt-1">
                SISTEMA CLÍNICO SEMILLA • EPSON TM-T88V
              </div>
              <div className="w-full border-b-2 border-dashed border-[#000000] my-1.5" />
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#000000] font-black">
                -- CORTE AUTOMÁTICO ESC/POS GS V 0 --
              </div>
            </div>

            {/* Borde dentado inferior de corte térmico */}
            <div className="w-full h-1 bg-[radial-gradient(circle,#000000_1px,transparent_1px)] bg-[size:6px_6px] mt-3 print:hidden" />
          </div>
        </div>
      </div>
    </div>
  )
}
