import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore, THEME_OPTIONS } from '../../store/themeStore'
import { useScannerStore } from '../../store/scannerStore'

interface CyberDrawerProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

export function CyberDrawer({ isOpen, onClose, onLogout }: CyberDrawerProps) {
  const { user } = useAuthStore()
  const { theme: currentTheme, setTheme } = useThemeStore()
  const { openScanner } = useScannerStore()
  const location = useLocation()

  const navLinks = [
    { path: '/admision', label: 'Matriz de Admisión', icon: 'person_add', badge: 'BIO-REG' },
    { path: '/triaje', label: 'Triaje Cuántico & Vitals', icon: 'insights', badge: 'RAC-Q' },
    { path: '/queue', label: 'Cola de Flujo Neuronal', icon: 'view_timeline' },
    { path: '/consulta', label: 'Diagnóstico Clínico', icon: 'stethoscope' },
    { path: '/tickets', label: 'Protocolo ESC/POS', icon: 'receipt_long' },
    { path: '/admin/personalizacion', label: 'Calibración Synth & HUD', icon: 'palette' },
    { path: '/admin/telemetria', label: 'Red Mesh & Webhooks', icon: 'hub' },
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
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Dark Glass Drawer Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-[320px] max-w-[85vw] h-full bg-[#070611]/95 backdrop-blur-2xl border-r border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] z-10 flex flex-col justify-between overflow-y-auto font-sans"
          >
            <div>
              {/* Drawer Top Branding */}
              <div className="p-5 border-b border-purple-900/40 flex items-center justify-between bg-gradient-to-b from-purple-950/40 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-800 to-fuchsia-600 text-white flex items-center justify-center font-bold text-xl shadow-[0_0_18px_rgba(217,70,239,0.6)]">
                    <span className="material-symbols-outlined text-[24px]">bolt</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-white tracking-wider uppercase font-sans">
                        NEXUS • SYNTH
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-neon-magenta bg-fuchsia-950/80 px-2 py-0.5 rounded border border-fuchsia-700/50 uppercase">
                      GLOW DRAWER V2.5
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-[#120f26] border border-purple-500/40 text-slate-300 hover:text-white hover:border-fuchsia-500 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* User Profile Card */}
              <div className="p-4 mx-3 my-3 rounded-2xl bg-[#0f0c22]/90 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#1a1438] border border-fuchsia-500/50 text-fuchsia-300 flex items-center justify-center font-mono font-bold text-sm shadow-[0_0_12px_rgba(217,70,239,0.3)]">
                    {user?.nombres?.charAt(0) ?? 'NX'}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="text-sm font-bold text-white truncate font-sans">
                      {user?.full_name ?? 'Operador Nexus'}
                    </div>
                    <div className="text-xs text-slate-400 truncate font-mono">
                      {user?.cmp_code ? `CMP: ${user.cmp_code}` : user?.dni ? `DNI: ${user.dni}` : 'Node Operator'}
                    </div>
                    <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-fuchsia-950/80 text-fuchsia-300 rounded-md border border-fuchsia-700/40">
                      {user?.role ?? 'Cyber Medic'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Theme Switcher Quick Selector */}
              <div className="px-4 py-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-fuchsia-400">palette</span>
                  Motor Visual de Render
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#100c26] rounded-xl border border-purple-500/30">
                  {THEME_OPTIONS.map((opt) => {
                    const isSelected = currentTheme === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className={`py-1.5 px-1 rounded-lg text-[11px] font-mono font-semibold flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.6)]'
                            : 'text-slate-400 hover:text-white hover:bg-purple-900/30'
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
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white hover:brightness-110 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.5)] cursor-pointer active:scale-98 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                  <span>Escanear Bio-QR</span>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="py-2 px-3">
                <div className="px-2 pb-2 text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
                  Nodos del Sistema
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
                            ? 'bg-gradient-to-r from-purple-900/80 to-fuchsia-950/80 text-white border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.25)]'
                            : 'text-slate-400 hover:bg-[#151030] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`material-symbols-outlined text-[20px] ${
                              isActive ? 'text-neon-cyan' : 'text-purple-400'
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
                                ? 'bg-fuchsia-500/30 text-neon-magenta border border-fuchsia-500/50'
                                : 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
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
            <div className="p-4 border-t border-purple-900/40 bg-gradient-to-t from-purple-950/40 to-transparent space-y-3 font-mono">
              <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-[#0e0b20] border border-purple-500/30 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse" />
                  <span>NEXUS-99 CORE</span>
                </div>
                <span className="text-purple-300 text-[10px]">LATENCY: 4ms</span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Desconectar Nodo</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}
