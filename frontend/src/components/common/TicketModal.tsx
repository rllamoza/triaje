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
  autoPrint?: boolean
  onNext?: () => void
  nextLabel?: string
}

export function TicketModal({
  isOpen,
  onClose,
  info,
  tickets,
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

  const isMulti = ticketList.length > 1
  const firstTicket = ticketList[0]

  useEffect(() => {
    if (ticketList.length === 0) return

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
  }, [tickets, info])

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

  // Si autoPrint está activo, disparar impresión cuando los QR estén listos
  useEffect(() => {
    const isReady = branding.ticketShowQr
      ? (ticketList.length > 0 && ticketList.every((t) => Boolean(qrUrls[t.ticket])))
      : true

    if (isOpen && autoPrint && isReady && !printed && ticketList.length > 0) {
      const timer = setTimeout(() => {
        handlePrint()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoPrint, qrUrls, printed, branding.ticketShowQr, ticketList.length])

  if (!isOpen || ticketList.length === 0 || !firstTicket) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-lg p-6 text-on-surface text-center animate-fade-in my-8 max-h-[92vh] flex flex-col justify-between">
        <div>
          <div className="w-14 h-14 mx-auto mb-2 bg-tertiary-container text-tertiary flex items-center justify-center rounded-full border border-tertiary/30">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>

          <div className="text-xs uppercase tracking-widest text-secondary font-bold font-mono">
            {isMulti ? `Registro Múltiple Guardado con Éxito (${ticketList.length} Especialidades)` : 'Registro Guardado con Éxito'}
          </div>

          <h2 className="text-xl font-black uppercase text-on-surface mt-1">
            {isMulti ? `${ticketList.length} Turnos Clínicos Asignados` : 'Turno Clínico Asignado'}
          </h2>

          {isMulti && (
            <div className="mt-2 p-2 bg-primary/10 border border-primary/30 text-[11px] text-primary font-medium">
              ℹ️ Se crearon <strong>{ticketList.length} turnos independientes</strong>. Se imprimirán secuencialmente en el rollo de papel para entregárselos al paciente.
            </div>
          )}

          {/* Recuadro de Turnos: Modo Simple vs Modo Múltiple */}
          {!isMulti ? (
            <div className="my-3.5 p-4 bg-primary/10 border-2 border-dashed border-primary">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-secondary block">
                CÓDIGO DE ATENCIÓN MÉDICA
              </span>
              <span className="text-5xl font-mono font-black text-primary my-1 block tracking-wider">
                #{firstTicket.ticket}
              </span>
              <div className="text-xs font-bold uppercase text-on-surface mt-1">
                {firstTicket.especialidad || 'Medicina General'}
              </div>
              <div className="text-xs font-mono text-on-surface-variant">
                Destino: {firstTicket.consultorio || 'Consultorio 01'} • {firstTicket.medico || 'Médico Asignado'}
              </div>
            </div>
          ) : (
            <div className="my-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {ticketList.map((t, idx) => (
                <div
                  key={t.ticket || idx}
                  className="p-3 bg-primary/5 border border-primary/40 text-left flex items-center justify-between hover:bg-primary/10 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-primary text-on-primary">
                        Ticket #{idx + 1}
                      </span>
                      <span className="text-xs font-bold uppercase text-on-surface truncate">
                        {t.especialidad || 'Especialidad'}
                      </span>
                    </div>
                    <div className="text-2xl font-mono font-black text-primary tracking-wider mt-0.5">
                      #{t.ticket}
                    </div>
                    <div className="text-[11px] font-mono text-on-surface-variant">
                      {t.consultorio || 'Consultorio 01'} • {t.medico || 'Médico de Turno'}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary text-2xl shrink-0">
                    confirmation_number
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Resumen de datos del Paciente */}
          <div className="bg-surface-container p-3.5 border border-surface-container-high text-left mb-3 space-y-2">
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
            <div className="flex justify-between items-center pt-1 border-t border-surface-container-high text-xs">
              <span className="text-[11px] text-on-surface-variant font-medium">Hora de Ingreso:</span>
              <span className="text-xs font-mono font-bold text-on-surface">{firstTicket.hora}</span>
            </div>
          </div>
        </div>

        {/* Elemento Térmico Invisible / Printable Aislado para el Driver */}
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
            {ticketList.map((t, idx) => (
              <div key={t.ticket || idx} className="thermal-ticket-unit">
                {/* Cabecera del Ticket */}
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
                    Comprobante de Turno de Atención {isMulti ? `• (${idx + 1}/${ticketList.length})` : ''}
                  </div>
                </div>

                {/* Recuadro de Turno */}
                <div className="text-center my-3 p-2 border-2 border-black">
                  <div className="text-[10px] font-bold uppercase">TURNO ASIGNADO</div>
                  <div className="text-3xl font-black tracking-widest my-1">#{t.ticket}</div>
                  <div className="text-xs font-bold uppercase">{t.especialidad || 'MEDICINA'}</div>
                  <div className="text-[10px]">{t.consultorio || 'Consultorio 01'}</div>
                </div>

                {/* Datos del Paciente en Letra Clara */}
                <div
                  className={`my-2.5 border-y-2 border-black py-2 text-black text-left ${
                    branding.ticketPatientFontSize === 'extra-grande'
                      ? 'space-y-2'
                      : branding.ticketPatientFontSize === 'normal'
                      ? 'space-y-1'
                      : 'space-y-1.5'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-black">
                      PACIENTE:
                    </span>
                    <span
                      className={`font-black text-black leading-tight uppercase ${
                        branding.ticketPatientFontSize === 'extra-grande'
                          ? 'text-lg'
                          : branding.ticketPatientFontSize === 'normal'
                          ? 'text-xs'
                          : 'text-base'
                      }`}
                    >
                      {t.paciente}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                    <span className="font-black text-black text-[11px] uppercase shrink-0">DNI:</span>
                    <strong
                      className={`font-mono font-black text-black text-right ${
                        branding.ticketPatientFontSize === 'extra-grande'
                          ? 'text-base'
                          : branding.ticketPatientFontSize === 'normal'
                          ? 'text-xs'
                          : 'text-sm'
                      }`}
                    >
                      {t.dni}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                    <span className="font-black text-black text-[11px] uppercase shrink-0">COMUNIDAD:</span>
                    <span
                      className={`font-bold text-black uppercase text-right truncate max-w-[65%] ${
                        branding.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      {t.comunidad}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                    <span className="font-black text-black text-[11px] uppercase shrink-0">HORA:</span>
                    <span
                      className={`font-mono font-bold text-black text-right ${
                        branding.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      {t.hora}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                    <span className="font-black text-black text-[11px] uppercase shrink-0">MÉDICO:</span>
                    <span
                      className={`font-bold text-black uppercase text-right truncate max-w-[65%] ${
                        branding.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      {t.medico || 'Médico Asignado'}
                    </span>
                  </div>

                  {t.motivo && (
                    <div className="border-t border-dotted border-black/60 pt-1 text-left">
                      <span className="font-black text-black text-[10px] uppercase block">ENTREGA DE FÁRMACOS:</span>
                      <div className="text-[10px] font-bold text-black mt-0.5 leading-tight">
                        {t.motivo}
                      </div>
                    </div>
                  )}
                </div>

                {/* Código QR (Ocultable por configuración de Personalización) */}
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

                {/* Separador de Corte entre Tickets si hay más de uno */}
                {idx < ticketList.length - 1 && (
                  <div className="my-5 pt-3 pb-2 border-y-2 border-dashed border-black text-center font-bold text-[10px] uppercase tracking-widest">
                    - - - - CORTE DE TICKET ({idx + 1}/{ticketList.length}) - - - -
                    <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />
                  </div>
                )}
              </div>
            ))}
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
                ? `✓ ${isMulti ? `Los ${ticketList.length} Tickets Impresos` : 'Ticket Impreso'} (Reimprimir)`
                : `Imprimir ${isMulti ? `los ${ticketList.length} Tickets Juntos` : 'Ticket Térmico'} (80mm)`}
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
