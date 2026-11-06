import { useState } from 'react'
import type { MedicamentoAdmin } from '../../api/hooks'
import { printThermalElement, detectDevice } from '../../utils/printEngine'
import { useBrandingStore, getEffectiveTicketLogo } from '../../store/brandingStore'

interface MedicamentosThermalModalProps {
  isOpen: boolean
  onClose: () => void
  medicamentos: MedicamentoAdmin[]
  campaignName: string
  campaignCode: string
}

export function MedicamentosThermalModal({
  isOpen,
  onClose,
  medicamentos,
  campaignName,
  campaignCode,
}: MedicamentosThermalModalProps) {
  const branding = useBrandingStore()
  const effectiveLogo = getEffectiveTicketLogo(branding)
  const device = detectDevice()

  const [filtro, setFiltro] = useState<'todos' | 'con_stock' | 'stock_bajo'>('todos')
  const [printing, setPrinting] = useState(false)
  const [printed, setPrinted] = useState(false)

  if (!isOpen) return null

  // Filtrado de la lista
  const filteredMeds = medicamentos.filter((m) => {
    const activo = Number(m.activo) === 1 || Boolean(m.activo)
    if (!activo) return false
    if (filtro === 'con_stock') return m.stock_actual > 0
    if (filtro === 'stock_bajo') return m.stock_actual <= m.stock_minimo
    return true
  })

  // Métricas de inventario
  const totalItems = medicamentos.length
  const totalStockUnidades = medicamentos.reduce((acc, m) => acc + (m.stock_actual || 0), 0)
  const totalStockBajo = medicamentos.filter((m) => Number(m.activo) === 1 && m.stock_actual <= m.stock_minimo).length
  const totalAgotados = medicamentos.filter((m) => Number(m.activo) === 1 && m.stock_actual === 0).length

  const currentDate = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const currentTime = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const handlePrint = async () => {
    setPrinting(true)
    try {
      const ok = await printThermalElement('medicamentos-t88-print', '80mm')
      if (ok) {
        setPrinted(true)
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface border-2 border-primary shadow-2xl w-full max-w-2xl text-on-surface animate-fade-in my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary/10 text-primary flex items-center justify-center rounded">
              <span className="material-symbols-outlined text-xl">receipt_long</span>
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-on-surface">
                Resumen de Medicamentos para Impresora Térmica (T88)
              </h2>
              <div className="text-[11px] text-on-surface-variant font-mono">
                {campaignName} ({campaignCode}) • Formato estándar 80mm ESC/POS
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Barra de Filtro Rápido */}
        <div className="p-3 bg-surface-container flex items-center justify-between border-b border-surface-container-high flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase text-on-surface-variant mr-1">Imprimir:</span>
            <button
              type="button"
              onClick={() => setFiltro('todos')}
              className={`px-2.5 py-1 text-xs font-semibold uppercase cursor-pointer transition-colors ${
                filtro === 'todos'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Todos ({medicamentos.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('con_stock')}
              className={`px-2.5 py-1 text-xs font-semibold uppercase cursor-pointer transition-colors ${
                filtro === 'con_stock'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Con Stock ({medicamentos.filter((m) => m.stock_actual > 0).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('stock_bajo')}
              className={`px-2.5 py-1 text-xs font-semibold uppercase cursor-pointer transition-colors ${
                filtro === 'stock_bajo'
                  ? 'bg-error text-on-error'
                  : 'bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Stock Bajo / Crítico ({totalStockBajo})
            </button>
          </div>

          <span className="text-[11px] text-on-surface-variant font-mono">
            {filteredMeds.length} ítems en ticket
          </span>
        </div>

        {/* Vista previa del Ticket Térmico 80mm */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-200/50 flex justify-center">
          <div
            id="medicamentos-t88-print"
            className="w-[320px] max-w-[320px] bg-white text-black p-4 shadow-md font-mono text-[11px] leading-tight select-text"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Header del Ticket */}
            <div className="text-center pb-2 border-b border-black">
              {effectiveLogo && (
                <img
                  src={effectiveLogo}
                  alt="Logo"
                  className="w-16 h-16 object-contain mx-auto mb-1 filter grayscale contrast-200"
                />
              )}
              <div className="font-black text-sm uppercase tracking-wider">{branding.appName || 'ONG SEMILLA'}</div>
              <div className="text-[10px] uppercase font-bold text-gray-800">
                {branding.exportHeader || 'SISTEMA DE ASISTENCIA CLÍNICA'}
              </div>
              <div className="text-[9px] uppercase mt-0.5">{branding.exportSubheader || 'REPORTE DE FARMACIA Y STOCK'}</div>
            </div>

            {/* Metadatos de Campaña */}
            <div className="py-2 border-b border-dotted border-black space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="font-bold">CAMPAÑA:</span>
                <span className="font-black uppercase text-right truncate max-w-[170px]">{campaignName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">CÓDIGO:</span>
                <span>{campaignCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">FECHA:</span>
                <span>{currentDate} {currentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">DISPOSITIVO:</span>
                <span>{device.deviceType}</span>
              </div>
            </div>

            {/* Resumen Cuantitativo */}
            <div className="py-2 border-b border-black space-y-1">
              <div className="font-black text-center text-xs uppercase bg-black text-white py-0.5">
                RESUMEN DE VADEMÉCUM
              </div>
              <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                <div>TOTAL ÍTEMS: <b>{totalItems}</b></div>
                <div className="text-right">UNID. TOTALES: <b>{totalStockUnidades}</b></div>
                <div className={totalStockBajo > 0 ? 'font-bold' : ''}>
                  STOCK BAJO: <b>{totalStockBajo}</b>
                </div>
                <div className={`text-right ${totalAgotados > 0 ? 'font-bold' : ''}`}>
                  AGOTADOS: <b>{totalAgotados}</b>
                </div>
              </div>
            </div>

            {/* Cabecera de la tabla */}
            <div className="pt-2">
              <div className="flex justify-between font-black border-b border-black pb-1 text-[10px]">
                <span>MEDICAMENTO / FORMA</span>
                <span>STOCK [MÍN]</span>
              </div>
            </div>

            {/* Listado de Medicamentos */}
            <div className="divide-y divide-dotted divide-gray-400 py-1">
              {filteredMeds.length === 0 ? (
                <div className="text-center py-4 italic">No hay medicamentos en este filtro.</div>
              ) : (
                filteredMeds.map((m, idx) => {
                  const bajo = m.stock_actual <= m.stock_minimo
                  const agotado = m.stock_actual === 0
                  return (
                    <div key={m.id || idx} className="py-1 text-[10px]">
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold truncate max-w-[210px]">
                          {m.clasificacion ? `[${m.clasificacion.toUpperCase()}] ` : ''}
                          {m.nombre_generico}
                        </span>
                        <span className={`font-black font-mono ${agotado ? 'text-black underline' : bajo ? 'font-black' : ''}`}>
                          {m.stock_actual}
                          <span className="font-normal text-[9px] text-gray-700"> [{m.stock_minimo}]</span>
                        </span>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-800">
                        <span>
                          {m.concentracion ? `${m.concentracion} ` : ''}
                          {m.forma_farmaceutica}
                          {m.via_administracion ? ` (${m.via_administracion})` : ''}
                          {m.uso ? ` • ${m.uso}` : ''}
                        </span>
                        {agotado ? (
                          <span className="font-bold uppercase tracking-tight">[AGOTADO]</span>
                        ) : bajo ? (
                          <span className="font-bold uppercase tracking-tight">[BAJO]</span>
                        ) : (
                          <span>{m.codigo || ''}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Pie de ticket y firmas */}
            <div className="pt-4 mt-2 border-t border-black text-center space-y-3">
              <div className="pt-6 border-t border-dotted border-black/80 max-w-[200px] mx-auto text-[9px]">
                RESPONSABLE DE FARMACIA / ALMACÉN
              </div>

              <div className="text-[9px] text-gray-700 leading-tight">
                <div>{branding.footerLeftText || 'ONG Semilla — Salud Rural'}</div>
                <div>{branding.footerRightText || 'Documento de Control de Inventario'}</div>
              </div>

              <div className="text-[8px] text-gray-500 font-mono tracking-widest pt-1">
                -- FIN DE INFORME T88 --
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal con Botones */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-between">
          <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-primary">print</span>
            <span>Impresión directa para <strong>Epson TM-T88 (80mm)</strong></span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-surface-container-highest text-xs font-semibold uppercase text-on-surface-variant hover:bg-surface-container cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="px-5 py-2.5 bg-primary text-on-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>
                {printing
                  ? 'Enviando a T88...'
                  : printed
                  ? '✓ Impreso (Reimprimir)'
                  : 'Imprimir en Impresora Térmica (80mm)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

