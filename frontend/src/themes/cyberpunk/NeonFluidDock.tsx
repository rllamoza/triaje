import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface NavTab {
  path: string
  label: string
  icon: string
  code: string
}

const TABS: NavTab[] = [
  { path: '/admision', label: 'ADMISIÓN', icon: 'how_to_reg', code: 'M1' },
  { path: '/triaje', label: 'TRIAJE', icon: 'vital_signs', code: 'M2' },
  { path: '/queue', label: 'COLA', icon: 'view_timeline', code: 'M3' },
  { path: '/consulta', label: 'CONSULTA', icon: 'stethoscope', code: 'M4' },
  { path: '/tickets', label: 'TICKET', icon: 'receipt_long', code: 'M5' },
]

export function NeonFluidDock() {
  const location = useLocation()
  const navigate = useNavigate()

  const currentPath = location.pathname === '/cola' ? '/queue' : location.pathname

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-3 pb-[env(safe-area-inset-bottom)]">
      <nav
        aria-label="Píldora Neón Cuántica de Navegación"
        className="pointer-events-auto relative w-full max-w-[390px] md:max-w-none md:w-auto flex items-center justify-between p-1 sm:p-1.5 rounded-full bg-[#0b0a16]/95 backdrop-blur-2xl border border-purple-500/35 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(168,85,247,0.25)]"
      >
        {TABS.map((tab) => {
          const isActive = currentPath === tab.path

          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`relative flex-1 md:flex-initial py-1.5 px-1 sm:px-2 md:px-4 md:py-2.5 rounded-full flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 transition-colors cursor-pointer select-none whitespace-nowrap min-h-[44px] md:min-h-[42px] ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {/* Glowing Neon Spring Fluid Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="cyber-active-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-[0_0_20px_rgba(217,70,239,0.7)] -z-10"
                  transition={{
                    type: 'spring',
                    stiffness: 450,
                    damping: 28,
                    mass: 0.8,
                  }}
                />
              )}

              <span className="material-symbols-outlined text-[18px] sm:text-[19px] md:text-[20px] leading-none shrink-0">
                {tab.icon}
              </span>
              <span className="text-[9.5px] sm:text-[10px] md:text-xs font-mono font-bold tracking-wider leading-tight">
                {tab.label}
              </span>
              <span
                className={`hidden md:inline-block text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-purple-950/80 text-fuchsia-400 border border-purple-800/40'
                }`}
              >
                {tab.code}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
