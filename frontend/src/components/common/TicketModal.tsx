import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { printThermalElement, detectDevice } from '../../utils/printEngine'
import { useBrandingStore, getEffectiveTicketLogo } from '../../store/brandingStore'

export interface TicketInfo {
  ticket: string
  paciente: string
  dni: string
  comunidad: string
  hora: string
  fecha?: string
  especialidad?: string
  medico?: string
  consultorio?: string
  motivo?: string
  prioridad?: string
}

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  info?: TicketInfo | null
  tickets?: TicketInfo[] | null
  mode?: 'admision' | 'general' | 'farmacia'
  autoPrint?: boolean
  onNext?: () => void
  nextLabel?: string
}

export function TicketModal({
  isOpen,
  onClose,
  info,
  tickets,
  mode,
  autoPrint = false,
  onNext,
  nextLabel = 'Aceptar y Siguiente',
}: TicketModalProps) {
  const branding = useBrandingStore()
  const effectiveLogo = getEffectiveTicketLogo(branding)
  const device = detectDevice()

  const [qrUrls, setQrUrls] = useState<Record<string, string>>({})
  const [printing, setPrinting] = useState(false)
  const [printed, setPrinted] = useState(false)

  // Normalizar a lista de tickets (1 o múltiples)
  const ticketList: TicketInfo[] = (tickets && tickets.length > 0)
    ? tickets
    : (info ? [info] : [])

  const firstTicket = ticketList[0]

  // Detectar si estamos en flujo de admisión / inscripción de paciente
  const isAdmision = mode === 'admision' || (!mode && !firstTicket?.motivo)
  const isMulti = ticketList.length > 1

  // Fecha por defecto si no viene en el ticket
  const displayFecha = firstTicket?.fecha || new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  useEffect(() => {
    if (ticketList.length === 0 || isAdmision) return

    ticketList.forEach((t) => {
      const payload = JSON.stringify({
        t: t.ticket,
        dni: t.dni,
        paciente: t.paciente,
        esp: t.especialidad || 'General',
        h: t.hora,
      })

      QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        scale: 4,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrUrls((prev) => ({ ...prev, [t.ticket]: url }))
        })
        .catch((err) => console.error('Error QR:', err))
    })
  }, [tickets, info, isAdmision])

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const paperWidth = branding.ticketPaperWidth || '80mm'
      const ok = await printThermalElement('assigned-ticket-printable', paperWidth)
      if (ok) {
        setPrinted(true)
      }
    } finally {
      setPrinting(false)
    }
  }

  // Si autoPrint está activo, disparar impresión
  useEffect(() => {
    const isReady = isAdmision
      ? true
      : branding.ticketShowQr
      ? (ticketList.length > 0 && ticketList.every((t) => Boolean(qrUrls[t.ticket])))
      : true

    if (isOpen && autoPrint && isReady && !printed && ticketList.length > 0) {
      const timer = setTimeout(() => {
        handlePrint()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoPrint, qrUrls, printed, branding.ticketShowQr, ticketList.length, isAdmision])

  if (!isOpen || ticketList.length === 0 || !firstTicket) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-lg p-6 text-on-surface text-center animate-fade-in my-8 max-h-[94vh] flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Logo Mediano Institucional en Admisión */}
          {effectiveLogo ? (
            <img
              src={effectiveLogo}
              alt="Logo Institucional"
              className="max-h-20 h-16 sm:h-20 mx-auto mb-2 object-contain"
            />
          ) : (
            <div className="w-14 h-14 mx-auto mb-2 bg-tertiary-container text-tertiary flex items-center justify-center rounded-full border border-tertiary/30">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
          )}

          <div className="text-xs uppercase tracking-widest text-secondary font-bold font-mono">
            {branding.appName || 'Asistencia Médica'}
          </div>

          <h2 className="text-xl font-black uppercase text-on-surface mt-1">
            {isAdmision ? 'Ticket de Inscripción' : (isMulti ? `${ticketList.length} Turnos Asignados` : 'Turno Clínico Asignado')}
          </h2>

          {/* Resumen de Datos del Paciente (CON FECHA Y HORA, SIN MÉDICO) */}
          <div className="bg-surface-container p-3.5 border border-surface-container-high text-left my-3 space-y-2">
            <div className="flex flex-col border-b border-surface-container-high pb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Paciente:</span>
              <strong className="text-sm font-black text-on-surface uppercase tracking-tight">
                {firstTicket.paciente}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant font-mono">DNI:</span>
                <strong className="text-xs font-mono font-bold text-on-surface">{firstTicket.dni}</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Comunidad:</span>
                <span className="text-xs text-on-surface capitalize font-medium">{firstTicket.comunidad}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-surface-container-high">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant font-mono">Fecha:</span>
                <span className="text-xs font-mono font-bold text-on-surface">{displayFecha}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant font-mono">Hora:</span>
                <span className="text-xs font-mono font-bold text-on-surface">{firstTicket.hora}</span>
              </div>
            </div>
          </div>

          {/* La o las Especialidades Elegidas */}
          {ticketList.length === 1 ? (
            <div className="my-3 p-3.5 bg-primary/10 border-2 border-dashed border-primary text-center">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-secondary block">
                ESPECIALIDAD ELEGIDA
              </span>
              <span className="text-4xl font-mono font-black text-primary my-1 block tracking-wider">
                #{firstTicket.ticket}
              </span>
              <div className="text-sm font-bold uppercase text-on-surface">
                {firstTicket.especialidad || 'Medicina General'}
              </div>
            </div>
          ) : (
            <div className="my-3 p-3 bg-primary/5 border border-primary/30 text-left">
              <span className="text-[11px] uppercase tracking-wider font-bold text-secondary block mb-2">
                ESPECIALIDADES ELEGIDAS ({ticketList.length}):
              </span>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {ticketList.map((t, idx) => (
                  <div
                    key={t.ticket || idx}
                    className="p-2 bg-surface border border-primary/25 flex items-center justify-between hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-primary text-on-primary">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold uppercase text-on-surface truncate">
                        {t.especialidad || 'Especialidad'}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-black text-primary">
                      #{t.ticket}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Espacio con Cruz en Medio dividiendo el Ticket en 4 Cuadrantes en Blanco para Sellos */}
          {isAdmision && (
            <div className="my-3 border-2 border-black bg-white text-black p-2 rounded-xs">
              <div className="text-[10px] font-black uppercase tracking-wider text-center border-b-2 border-black pb-1 mb-1 font-mono">
                ESPACIO PARA SELLOS Y FIRMAS MÉDICAS
              </div>
              {/* Fila Superior: Cuadrantes 1 y 2 */}
              <div className="grid grid-cols-2 border-b-2 border-black min-h-[75px]">
                <div className="p-1.5 border-r-2 border-black text-left flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-gray-700 uppercase font-mono">1. SELLO / FIRMA</span>
                  <div className="h-10 flex items-center justify-center text-[10px] text-gray-300 italic font-mono">
                    [Sello Médico]
                  </div>
                </div>
                <div className="p-1.5 text-left flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-gray-700 uppercase font-mono">2. SELLO / FIRMA</span>
                  <div className="h-10 flex items-center justify-center text-[10px] text-gray-300 italic font-mono">
                    [Sello Médico]
                  </div>
                </div>
              </div>
              {/* Fila Inferior: Cuadrantes 3 y 4 */}
              <div className="grid grid-cols-2 min-h-[75px]">
                <div className="p-1.5 border-r-2 border-black text-left flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-gray-700 uppercase font-mono">3. SELLO / FIRMA</span>
                  <div className="h-10 flex items-center justify-center text-[10px] text-gray-300 italic font-mono">
                    [Sello Médico]
                  </div>
                </div>
                <div className="p-1.5 text-left flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-gray-700 uppercase font-mono">4. SELLO / FIRMA</span>
                  <div className="h-10 flex items-center justify-center text-[10px] text-gray-300 italic font-mono">
                    [Sello Médico]
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Elemento Térmico Printable Aislado para el Driver */}
        <div className="hidden">
          <div
            id="assigned-ticket-printable"
            className="p-3 text-black bg-white font-mono text-xs mx-auto"
            style={{
              width: '100%',
              maxWidth: branding.ticketPaperWidth === '58mm' ? '48mm' : '68mm',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            {isAdmision ? (
              // === TICKET DE INSCRIPCIÓN (Consolidado con Logo Mediano, Datos + Fecha, Especialidades y 4 Cuadrantes para Sellos) ===
              <div className="thermal-ticket-unit text-black bg-white">
                {/* 1. Logo Mediano y Cabecera */}
                <div className="text-center pb-2 border-b-2 border-black">
                  {effectiveLogo ? (
                    <img
                      src={effectiveLogo}
                      alt="Logo"
                      className="max-h-20 h-16 sm:h-20 mx-auto mb-1.5 object-contain"
                    />
                  ) : (
                    <div className="font-bold text-base uppercase tracking-wider">{branding.appName}</div>
                  )}
                  <div className="font-bold text-xs uppercase">{branding.appName}</div>
                  {branding.loginTitle && (
                    <div className="text-[10px] font-bold text-gray-800">{branding.loginTitle}</div>
                  )}
                  <div className="text-[9px] font-bold text-gray-700 mt-0.5 uppercase tracking-wide">
                    TICKET DE INSCRIPCIÓN Y ATENCIÓN
                  </div>
                </div>

                {/* 2. Datos del Paciente (CON FECHA Y HORA, SIN MÉDICO) */}
                <div className="my-2 border-y-2 border-black py-1.5 text-black text-left space-y-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-black">PACIENTE:</span>
                    <span className="font-black text-black text-sm leading-tight uppercase">
                      {firstTicket.paciente}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-0.5">
                    <span className="font-black text-black text-[10px] uppercase">DNI:</span>
                    <strong className="font-mono font-black text-xs text-black">{firstTicket.dni}</strong>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-0.5">
                    <span className="font-black text-black text-[10px] uppercase">COMUNIDAD:</span>
                    <span className="font-bold uppercase text-xs truncate max-w-[65%] text-black">
                      {firstTicket.comunidad}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-0.5">
                    <span className="font-black text-black text-[10px] uppercase">FECHA:</span>
                    <span className="font-mono font-bold text-xs text-black">{displayFecha}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-0.5">
                    <span className="font-black text-black text-[10px] uppercase">HORA:</span>
                    <span className="font-mono font-bold text-xs text-black">{firstTicket.hora}</span>
                  </div>
                </div>

                {/* 3. La o las Especialidades Elegidas */}
                <div className="my-2 border-2 border-black p-2 text-center bg-white">
                  {ticketList.length === 1 ? (
                    <div>
                      <div className="text-[9px] font-black uppercase">TURNO DE ATENCIÓN</div>
                      <div className="text-3xl font-mono font-black tracking-widest my-1">
                        #{firstTicket.ticket}
                      </div>
                      <div className="text-xs font-black uppercase">
                        {firstTicket.especialidad || 'MEDICINA GENERAL'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[9px] font-black uppercase border-b border-black pb-1 mb-1.5">
                        ESPECIALIDADES ELEGIDAS ({ticketList.length})
                      </div>
                      <div className="space-y-1 text-left">
                        {ticketList.map((t, idx) => (
                          <div
                            key={t.ticket || idx}
                            className="flex justify-between items-center text-xs border-b border-dotted border-black/50 pb-0.5"
                          >
                            <span className="font-bold uppercase truncate max-w-[70%]">
                              {idx + 1}. {t.especialidad || 'Especialidad'}
                            </span>
                            <strong className="font-mono font-black text-sm">#{t.ticket}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Espacio con Cruz en Medio dividiendo en 4 Cuadrantes en Blanco para Sellos */}
                <div className="my-2.5 border-2 border-black bg-white">
                  <div className="text-[8px] font-black uppercase text-center border-b-2 border-black py-0.5 bg-gray-50 tracking-wider">
                    ESPACIO PARA SELLOS Y FIRMAS MÉDICAS
                  </div>

                  {/* Fila Superior: Cuadrantes 1 y 2 */}
                  <div className="grid grid-cols-2 border-b-2 border-black min-h-[110px]">
                    <div className="p-1 border-r-2 border-black flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-black uppercase">1. SELLO / FIRMA:</span>
                      <div className="h-24" />
                    </div>
                    <div className="p-1 flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-black uppercase">2. SELLO / FIRMA:</span>
                      <div className="h-24" />
                    </div>
                  </div>

                  {/* Fila Inferior: Cuadrantes 3 y 4 */}
                  <div className="grid grid-cols-2 min-h-[110px]">
                    <div className="p-1 border-r-2 border-black flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-black uppercase">3. SELLO / FIRMA:</span>
                      <div className="h-24" />
                    </div>
                    <div className="p-1 flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-black uppercase">4. SELLO / FIRMA:</span>
                      <div className="h-24" />
                    </div>
                  </div>
                </div>

                {/* 5. Pie de ticket */}
                <div className="text-center text-[9px] pt-1.5 border-t border-black text-black">
                  {branding.footerLeftText && <div>{branding.footerLeftText}</div>}
                  {branding.footerRightText && <div>{branding.footerRightText}</div>}
                </div>
              </div>
            ) : (
              // === MODO FARMACIA / PRUEBA TÉRMICA ===
              ticketList.map((t, idx) => (
                <div key={t.ticket || idx} className="thermal-ticket-unit">
                  <div className="text-center pb-2 border-b border-black">
                    {effectiveLogo && (
                      <img
                        src={effectiveLogo}
                        alt="Logo"
                        className="max-h-12 mx-auto mb-1 object-contain"
                      />
                    )}
                    <div className="font-bold text-sm uppercase">{branding.appName}</div>
                    <div className="text-[10px] font-bold">{branding.loginTitle}</div>
                    <div className="text-[9px] text-gray-700">
                      Comprobante de Turno {isMulti ? `• (${idx + 1}/${ticketList.length})` : ''}
                    </div>
                  </div>

                  <div className="text-center my-3 p-2 border-2 border-black">
                    <div className="text-[10px] font-bold uppercase">TURNO ASIGNADO</div>
                    <div className="text-3xl font-black tracking-widest my-1">#{t.ticket}</div>
                    <div className="text-xs font-bold uppercase">{t.especialidad || 'MEDICINA'}</div>
                    <div className="text-[10px]">{t.consultorio || 'Consultorio 01'}</div>
                  </div>

                  <div className="my-2.5 border-y-2 border-black py-2 text-black text-left space-y-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-black">PACIENTE:</span>
                      <span className="font-black text-black text-sm uppercase leading-tight">{t.paciente}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                      <span className="font-black text-[11px] uppercase">DNI:</span>
                      <strong className="font-mono font-black text-xs">{t.dni}</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                      <span className="font-black text-[11px] uppercase">COMUNIDAD:</span>
                      <span className="font-bold uppercase text-xs truncate max-w-[65%]">{t.comunidad}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                      <span className="font-black text-[11px] uppercase">HORA:</span>
                      <span className="font-mono font-bold text-xs">{t.hora}</span>
                    </div>
                    {t.medico && (
                      <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                        <span className="font-black text-[11px] uppercase">MÉDICO:</span>
                        <span className="font-bold uppercase text-xs truncate max-w-[65%]">{t.medico}</span>
                      </div>
                    )}
                    {t.motivo && (
                      <div className="border-t border-dotted border-black/60 pt-1 text-left">
                        <span className="font-black text-[10px] uppercase block">ENTREGA DE FÁRMACOS:</span>
                        <div className="text-[10px] font-bold text-black mt-0.5 leading-tight">{t.motivo}</div>
                      </div>
                    )}
                  </div>

                  {branding.ticketShowQr && qrUrls[t.ticket] && (
                    <div className="text-center my-2.5 pt-1">
                      <img src={qrUrls[t.ticket]} alt={`QR #${t.ticket}`} className="w-28 h-28 mx-auto" />
                      <div className="text-[9px] font-bold mt-1 text-black uppercase">
                        Valide este QR en su atención clínica ({t.especialidad})
                      </div>
                    </div>
                  )}

                  <div className="text-center text-[9px] pt-2 border-t border-black">
                    <div>{branding.footerLeftText}</div>
                    <div>{branding.footerRightText}</div>
                  </div>

                  {idx < ticketList.length - 1 && (
                    <div className="my-5 pt-3 pb-2 border-y-2 border-dashed border-black text-center font-bold text-[10px] uppercase tracking-widest">
                      - - - - CORTE DE TICKET ({idx + 1}/{ticketList.length}) - - - -
                      <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-2 mt-4 pt-2 border-t border-surface-container-high">
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="w-full py-3 bg-tertiary hover:bg-tertiary-fixed text-on-tertiary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>
              {printing
                ? 'Enviando a Impresora...'
                : printed
                ? '✓ Ticket Impreso (Reimprimir)'
                : 'Imprimir Ticket Térmico (80mm)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onNext) onNext()
              else onClose()
            }}
            className="w-full py-3 bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition-colors"
          >
            {nextLabel}
          </button>

          <div className="mt-1 text-[11px] text-on-surface-variant font-mono">
            Driver detectado: <strong>{device.deviceType}</strong> • Papel: <strong>{branding.ticketPaperWidth || '80mm'}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketModal
