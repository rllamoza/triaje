import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useBrandingStore } from '../../store/brandingStore'
import { useThemeStore, THEME_OPTIONS } from '../../store/themeStore'
import { useScannerStore } from '../../store/scannerStore'
import { useNodeStatus } from '../../api/hooks'

interface GlassDrawerProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

export function GlassDrawer({ isOpen, onClose, onLogout }: GlassDrawerProps) {
  const { user } = useAuthStore()
  const branding = useBrandingStore()
  const { theme: currentTheme, setTheme } = useThemeStore()
  const { openScanner } = useScannerStore()
  const { data: nodeStatus } = useNodeStatus()
  const location = useLocation()

  const navLinks = [
    { path: '/admision', label: 'Registro de Pacientes', icon: 'person_add', badge: 'Nuevo' },
    { path: '/triaje', label: 'Triaje Clínico & Vitals', icon: 'vital_signs', badge: 'RAC' },
    { path: '/queue', label: 'Cola de Espera Médica', icon: 'view_timeline' },
    { path: '/consulta', label: 'Consulta Médica', icon: 'stethoscope' },
    { path: '/tickets', label: 'Ticket Térmico ESC/POS', icon: 'receipt_long' },
    { path: '/admin/personalizacion', label: 'Personalización & Branding', icon: 'palette' },
    { path: '/admin/telemetria', label: 'Telemetría & Red Mesh', icon: 'hub' },
    { path: '/admin/auditoria', label: 'Auditoría Forense & audi_triaje', icon: 'policy' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0a2540]/35 backdrop-blur-md"
          />

          {/* Frosted Glass Drawer Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-[320px] max-w-[85vw] h-full bg-white/95 backdrop-blur-2xl border-r border-[#cbdbf5] shadow-2xl z-10 flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Drawer Top Branding */}
              <div className="p-5 border-b border-[#cbdbf5] flex items-center justify-between bg-gradient-to-b from-blue-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0a2540] text-emerald-400 flex items-center justify-center font-bold text-xl shadow-xs">
                    <span className="material-symbols-outlined text-[24px]">potted_plant</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#0a2540] tracking-wider uppercase font-sans">
                        {branding.appName}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0f62fe] bg-[#e8f1ff] px-1.5 py-0.2 rounded border border-[#0f62fe]/20 uppercase">
                      Clinica Glass
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white border border-[#cbdbf5] text-[#0a2540] hover:bg-slate-50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* User Profile Card */}
              <div className="p-4 mx-3 my-3 rounded-2xl bg-white/90 border border-[#cbdbf5] shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0a2540] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {user?.nombres?.charAt(0) ?? 'SC'}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="text-sm font-bold text-[#0a2540] truncate">
                      {user?.full_name ?? 'Personal Clínico'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user?.cmp_code ? `CMP: ${user.cmp_code}` : user?.dni ? `DNI: ${user.dni}` : 'Operador Semilla'}
                    </div>
                    <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                      {user?.role ?? 'Operador'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Switcher Quick Selector */}
              <div className="px-4 py-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#3c5678] mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-[#0a2540]">palette</span>
                  Tema Visual de la Interfaz
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f0f4fc] rounded-xl border border-[#cbdbf5]">
                  {THEME_OPTIONS.map((opt) => {
                    const isSelected = currentTheme === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0a2540] text-white shadow-xs'
                            : 'text-[#3c5678] hover:text-[#0a2540] hover:bg-white/60'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">{opt.icon}</span>
                        <span className="truncate">{opt.name.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Action QR Scanner */}
              <div className="px-3 pt-2 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    openScanner()
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0a2540] text-white hover:bg-[#133b63] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                  <span>Escanear QR de Paciente</span>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-2 px-3">
                <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Módulos de Campaña
                </div>
                <nav className="space-y-1">
                  {navLinks.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path === '/queue' && location.pathname === '/cola')
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#0a2540] text-white shadow-xs'
                            : 'text-[#3c5678] hover:bg-[#f0f4fc] hover:text-[#0a2540]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-[20px] ${
                              isActive ? 'text-emerald-400' : 'text-[#0a2540]'
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#e8f1ff] text-[#0f62fe] border border-[#cbdbf5]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Bottom Status & Logout */}
            <div className="p-4 border-t border-[#cbdbf5] bg-gradient-to-t from-blue-50/50 to-transparent space-y-3">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/80 border border-[#cbdbf5] text-[11px]">
                <div className="flex items-center gap-1.5 text-[#0a2540] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>120 FPS Spring Phys</span>
                </div>
                <span className="font-mono text-slate-500 text-[10px]">
                  {nodeStatus?.node_id ?? 'STARLINK-01'}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-3 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100/80 text-red-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
