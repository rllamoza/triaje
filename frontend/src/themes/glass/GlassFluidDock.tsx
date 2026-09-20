import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface NavTab {
  path: string
  label: string
  icon: string
  badge?: string
}

const TABS: NavTab[] = [
  { path: '/admision', label: 'Admisión', icon: 'how_to_reg' },
  { path: '/triaje', label: 'Triaje', icon: 'vital_signs', badge: 'M3' },
  { path: '/queue', label: 'Cola', icon: 'view_timeline' },
  { path: '/consulta', label: 'Consulta', icon: 'stethoscope' },
  { path: '/tickets', label: 'Tickets', icon: 'receipt_long' },
]

export function GlassFluidDock() {
  const location = useLocation()
  const navigate = useNavigate()

  const currentPath = location.pathname === '/cola' ? '/queue' : location.pathname

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-3 pb-[env(safe-area-inset-bottom)]">
      <nav
        aria-label="Píldora Fluida Clínica de Navegación"
        className="pointer-events-auto relative w-full max-w-[390px] md:max-w-none md:w-auto flex items-center justify-between p-1 sm:p-1.5 rounded-full bg-white/95 backdrop-blur-2xl border border-[#cbdbf5] shadow-[0_12px_36px_rgba(10,37,64,0.18)]"
      >
        {TABS.map((tab) => {
          const isActive = currentPath === tab.path

          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`relative flex-1 md:flex-initial py-1.5 px-1 sm:px-2 md:px-4 md:py-2.5 rounded-full flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 transition-colors cursor-pointer select-none whitespace-nowrap min-h-[44px] md:min-h-[42px] ${
                isActive ? 'text-white' : 'text-[#3c5678] hover:text-[#0a2540]'
              }`}
            >
              {/* Active Spring Fluid Pill Indicator */}
              {isActive && (
                <motion.div
                  layoutId="glass-active-pill"
                  className="absolute inset-0 rounded-full bg-[#0a2540] shadow-[0_4px_16px_rgba(10,37,64,0.35)] -z-10"
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
              <span className="text-[9.5px] sm:text-[10px] md:text-xs font-semibold font-sans tracking-tight leading-tight">
                {tab.label}
              </span>
              {tab.badge && (
                <span
                  className={`hidden md:inline-block text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100/70 text-[#0a2540]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
