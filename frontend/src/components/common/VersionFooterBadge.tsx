import { useState } from 'react'

export const SYSTEM_VERSIONS = [
  {
    version: 'v2.1.0',
    date: '13 Nov 2026',
    current: true,
    title: 'Producción: Correlativo Diario 0001, Edad, Distrito & Seguridad Estricta',
    description: 'Última y más actualizada versión de producción: reinicio diario del ticket a 0001, edad y distrito integrados, retiro total de autologin y vademécum en tiempo real.',
  },
  {
    version: 'v1.0.6',
    date: '05 Nov 2026',
    current: false,
    title: 'Farmacia, Dispensación & Descuento de Stock',
    description: 'Entrega de fármacos con receta, registro de doctor, descuento interactivo en grid/modal, cargos con firma/foto y comprobante configurable.',
  },
  {
    version: 'v1.0.5',
    date: '04 Nov 2026',
    current: false,
    title: 'Persistencia MySQL & Calibración Térmica',
    description: 'Persistencia de constantes en BD (system_settings), control de antecedentes, centrado geométrico de tickets y suite de pruebas en test/.',
  },
  {
    version: 'v1.0.4',
    date: '02 Nov 2026',
    current: false,
    title: 'Catálogo de Medicamentos & UI Limpia',
    description: 'Importación Excel, sincronización de fármacos y simplificación de pantalla de inicio.',
  },
  {
    version: 'v1.0.3',
    date: '20 Oct 2026',
    current: false,
    title: 'Telemetría Satelital & Auditoría',
    description: 'Sincronización P2P local, auditoría forense de eventos y registros en tiempo real.',
  },
  {
    version: 'v1.0.2',
    date: '05 Oct 2026',
    current: false,
    title: 'Consulta Médica & Recetas CIE-10',
    description: 'Módulo de diagnóstico clínico, prescripción farmacéutica y flujo directo.',
  },
  {
    version: 'v1.0.1',
    date: '25 Sep 2026',
    current: false,
    title: 'Tickets Térmicos ESC/POS & Colas',
    description: 'Impresión térmica nativa por USB/red, tickets con QR y gestión de turnos.',
  },
  {
    version: 'v1.0.0',
    date: '18 Sep 2026',
    current: false,
    title: 'Lanzamiento Inicial de Campo',
    description: 'Triaje somatométrico offline-first para brigadas médicas rurales itinerantes.',
  },
]

export function VersionFooterBadge() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Botón discreto en la esquina inferior derecha de todas las pantallas */}
      <div className="fixed bottom-1 right-2 z-40 select-none print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Ver versiones del sistema y licencia MIT"
          className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono tracking-tight text-on-surface-variant/75 hover:text-on-surface bg-surface/90 hover:bg-surface backdrop-blur-xs border border-surface-container-high rounded-xs shadow-2xs transition-all cursor-pointer hover:border-primary/40"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-primary">v1.0.5</span>
          <span className="text-outline/60">•</span>
          <span>Licencia MIT</span>
        </button>
      </div>

      {/* Modal / Diálogo de Versiones y Licencia MIT */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="relative w-full max-w-lg bg-surface border border-surface-container-highest shadow-2xl p-6 text-on-surface text-left animate-scale-in">
            {/* Cabecera */}
            <div className="flex items-start justify-between pb-3 border-b border-surface-container-high">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-primary text-on-primary">
                    v1.0.5
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-emerald-900/30 text-emerald-600 border border-emerald-500/30">
                    Licencia MIT
                  </span>
                </div>
                <h3 className="text-base font-bold text-on-surface mt-1.5">
                  Semilla Triaje Clínico &amp; Campañas
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Control clínico offline-first para brigadas médicas rurales
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                aria-label="Cerrar modal de versiones"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Contenido: Licencia MIT */}
            <div className="my-3 p-3 bg-surface-container-low border border-surface-container-high text-xs">
              <div className="font-semibold text-[11px] uppercase tracking-wider text-on-surface mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">verified_user</span>
                <span>Términos de Licencia MIT (Open Source)</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Este software está liberado bajo la <strong>Licencia MIT</strong>. Se autoriza su libre uso, copia, modificación, integración y distribución sin costo para fines humanitarios, clínicos y asistenciales.
              </p>
            </div>

            {/* Historial de Todas las Versiones */}
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Historial de Versiones Publicadas
              </div>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {SYSTEM_VERSIONS.map((item) => (
                  <div
                    key={item.version}
                    className={`p-2.5 border text-xs transition-colors ${
                      item.current
                        ? 'bg-primary-container/20 border-primary/50'
                        : 'bg-surface-container-low border-surface-container-high'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary">
                          {item.version}
                        </span>
                        {item.current && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-primary text-on-primary">
                            Actual
                          </span>
                        )}
                        <span className="font-semibold text-on-surface">
                          — {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-on-surface-variant">
                        {item.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="mt-5 pt-3 border-t border-surface-container-high flex justify-between items-center text-xs text-on-surface-variant">
              <span className="text-[11px] font-mono">
                ONG Semilla • Asistencia Médica Rural
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

