import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScannerStore } from '../../store/scannerStore'

export function CyberFab() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { openScanner } = useScannerStore()

  const actions = [
    {
      label: 'Triaje Cuántico',
      icon: 'insights',
      color: 'bg-purple-600',
      onClick: () => navigate('/triaje'),
    },
    {
      label: 'Diagnóstico Bio',
      icon: 'stethoscope',
      color: 'bg-fuchsia-600',
      onClick: () => navigate('/consulta'),
    },
    {
      label: 'Ticket ESC/POS',
      icon: 'receipt_long',
      color: 'bg-cyan-600',
      onClick: () => navigate('/tickets'),
    },
    {
      label: 'Escanear Bio-QR',
      icon: 'qr_code_scanner',
      color: 'bg-pink-600',
      onClick: () => openScanner(),
    },
  ]

  return (
    <div className="fixed bottom-22 right-4 md:bottom-24 md:right-6 xl:bottom-6 xl:right-8 z-40 flex flex-col items-end pointer-events-none font-mono">
      {/* Radial Fan-Out Submenu */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-2.5 mb-3 items-end pointer-events-auto">
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.8 }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 28,
                  delay: i * 0.04,
                }}
                onClick={() => {
                  setIsOpen(false)
                  action.onClick()
                }}
                className="flex items-center gap-2.5 bg-[#0f0c22] text-white border border-purple-500/40 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.3)] text-xs font-mono hover:border-fuchsia-400 hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] active:scale-95 transition-all cursor-pointer"
              >
                <span>{action.label}</span>
                <span
                  className={`w-7 h-7 rounded-full ${action.color} text-white flex items-center justify-center shadow-xs`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {action.icon}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger FAB */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Acciones Rápidas Synth"
        className="pointer-events-auto w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-[0_0_24px_rgba(217,70,239,0.7)] hover:brightness-110 active:scale-90 transition-all cursor-pointer"
      >
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="material-symbols-outlined text-[24px] md:text-[28px]"
        >
          add
        </motion.span>
      </button>
    </div>
  )
}
