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
  info: TicketInfo | null
  autoPrint?: boolean
  onNext?: () => void
  nextLabel?: string
}

export function TicketModal({
  isOpen,
  onClose,
  info,
  autoPrint = false,
  onNext,
  nextLabel = 'Aceptar y Siguiente',
}: TicketModalProps) {
  const branding = useBrandingStore()
  const effectiveLogo = getEffectiveTicketLogo(branding)
  const device = detectDevice()

  const [qrUrl, setQrUrl] = useState<string>('')
  const [printing, setPrinting] = useState(false)
  const [printed, setPrinted] = useState(false)

  useEffect(() => {
    if (!info) return
    const payload = JSON.stringify({
      t: info.ticket,
      dni: info.dni,
      paciente: info.paciente,
      esp: info.especialidad || 'General',
      h: info.hora,
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
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('Error QR:', err))
  }, [info])

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const ok = await printThermalElement('assigned-ticket-printable', '80mm')
      if (ok) {
        setPrinted(true)
      }
    } finally {
      setPrinting(false)
    }
  }

  // Si autoPrint está activo, disparar impresión
  useEffect(() => {
    const isReady = branding.ticketShowQr ? Boolean(qrUrl) : true
    if (isOpen && autoPrint && isReady && !printed) {
      const timer = setTimeout(() => {
        handlePrint()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoPrint, qrUrl, printed, branding.ticketShowQr])

  if (!isOpen || !info) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-md p-6 text-on-surface text-center animate-fade-in my-8">
        <div className="w-14 h-14 mx-auto mb-2 bg-tertiary-container text-tertiary flex items-center justify-center rounded-full border border-tertiary/30">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
        </div>

        <div className="text-xs uppercase tracking-widest text-secondary font-bold font-mono">
          Registro Guardado con Éxito
        </div>

        <h2 className="text-xl font-black uppercase text-on-surface mt-1">
          Turno Clínico Asignado
        </h2>

        {/* Recuadro Destacado con Código de Turno */}
        <div className="my-3.5 p-4 bg-primary/10 border-2 border-dashed border-primary">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-secondary block">
            CÓDIGO DE ATENCIÓN MÉDICA
          </span>
          <span className="text-5xl font-mono font-black text-primary my-1 block tracking-wider">
            #{info.ticket}
          </span>
          <div className="text-xs font-bold uppercase text-on-surface mt-1">
            {info.especialidad || 'Medicina General'}
          </div>
          <div className="text-xs font-mono text-on-surface-variant">
            Destino: {info.consultorio || 'Consultorio 01'} • {info.medico || 'Médico Asignado'}
          </div>
        </div>

        {/* Resumen de datos con tipografía clara y legible */}
        <div className="bg-surface-container p-3.5 border border-surface-container-high text-left mb-3 space-y-2">
          <div className="flex flex-col border-b border-surface-container-high pb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-secondary">Paciente:</span>
            <strong className="text-sm font-black text-on-surface uppercase tracking-tight">{info.paciente}</strong>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant font-mono">DNI:</span>
              <strong className="text-xs font-mono font-bold text-on-surface">{info.dni}</strong>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Comunidad:</span>
              <span className="text-xs text-on-surface capitalize font-medium">{info.comunidad}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-surface-container-high text-xs">
            <span className="text-[11px] text-on-surface-variant font-medium">Hora de Ingreso:</span>
            <span className="text-xs font-mono font-bold text-on-surface">{info.hora}</span>
          </div>
        </div>

        {/* Elemento Térmico Invisible / Printable Aislado para el Driver */}
        <div className="hidden">
          <div
            id="assigned-ticket-printable"
            className="p-2 pl-[7px] ml-[7px] pr-[2px] mr-[2px] text-black bg-white font-mono text-xs"
            style={{ marginLeft: '7px', paddingLeft: '7px', marginRight: '2px', paddingRight: '2px' }}
          >
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
              <div className="text-[9px] text-gray-700">Comprobante de Turno de Atención</div>
            </div>

            <div className="text-center my-3 p-2 border-2 border-black">
              <div className="text-[10px] font-bold uppercase">TURNO ASIGNADO</div>
              <div className="text-3xl font-black tracking-widest my-1">#{info.ticket}</div>
              <div className="text-xs font-bold uppercase">{info.especialidad || 'MEDICINA'}</div>
              <div className="text-[10px]">{info.consultorio || 'Consultorio 01'}</div>
            </div>

            {/* Datos del Paciente en Letra Clara y Grande para Fácil Lectura */}
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
                  {info.paciente}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                <span className="font-black text-black text-[11px] uppercase">DNI:</span>
                <strong
                  className={`font-mono font-black text-black ${
                    branding.ticketPatientFontSize === 'extra-grande'
                      ? 'text-base'
                      : branding.ticketPatientFontSize === 'normal'
                      ? 'text-xs'
                      : 'text-sm'
                  }`}
                >
                  {info.dni}
                </strong>
              </div>

              <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                <span className="font-black text-black text-[11px] uppercase">COMUNIDAD:</span>
                <span
                  className={`font-bold text-black uppercase ${
                    branding.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                  }`}
                >
                  {info.comunidad}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                <span className="font-black text-black text-[11px] uppercase">HORA:</span>
                <span
                  className={`font-mono font-bold text-black ${
                    branding.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                  }`}
                >
                  {info.hora}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-dotted border-black/60 pt-1">
                <span className="font-black text-black text-[11px] uppercase">MÉDICO:</span>
                <span
                  className={`font-bold text-black uppercase ${
                    branding.ticketPatientFontSize === 'extra-grande' ? 'text-sm' : 'text-xs'
                  }`}
                >
                  {info.medico || 'Médico Asignado'}
                </span>
              </div>
            </div>

            {/* Código QR (Ocultable por configuración de Personalización) */}
            {branding.ticketShowQr && qrUrl && (
              <div className="text-center my-2.5 pt-1">
                <img src={qrUrl} alt="QR Turno" className="w-28 h-28 mx-auto" />
                <div className="text-[9px] font-bold mt-1 text-black uppercase">
                  Valide este QR en su atención clínica
                </div>
              </div>
            )}

            <div className="text-center text-[9px] pt-2 border-t border-black">
              <div>{branding.footerLeftText}</div>
              <div>{branding.footerRightText}</div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-2 mt-4">
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="w-full py-3 bg-tertiary hover:bg-tertiary-fixed text-on-tertiary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>{printing ? 'Enviando a Impresora...' : printed ? '✓ Ticket Impreso (Reimprimir)' : 'Imprimir Ticket Térmico (80mm)'}</span>
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
        </div>

        <div className="mt-2 text-[11px] text-on-surface-variant font-mono">
          Driver detectado: <strong>{device.deviceType}</strong>
        </div>
      </div>
    </div>
  )
}
export default TicketModal

